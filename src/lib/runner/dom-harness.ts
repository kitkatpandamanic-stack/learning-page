import { transform, type Transform } from "sucrase";

import { MAX_OUTPUT_LINES } from "./execute";
import { createFormatter } from "./format";
import { addLoopGuards } from "./loop-guard";

/**
 * Runs inside the preview page, before the learner's HTML. It captures the
 * console (formatted by format.ts's createFormatter, copied in), reports
 * errors, stops runaway loops, and defines `__pandaRun(code, checks, emit)`,
 * which runs the learner's script and then the checks in the page's global
 * scope. In a sandboxed iframe it talks to the parent with postMessage; in
 * Node tests jsdom calls `__pandaRun` directly.
 *
 * Plain ES2017 in a string: no template literals, and never "</script>".
 */
const HARNESS = String.raw`
(function () {
  "use strict";
  var MAX_LINES = __MAX_LINES__;
  var LOOP_LIMIT_MS = 2000;
  var emitTo = function () {};
  var count = 0;
  var stopped = false;
  var firstError = null;

  function emit(level, text) {
    if (count >= MAX_LINES) {
      if (!stopped) {
        stopped = true;
        emitTo("warn", "Output stopped after " + MAX_LINES + " lines.");
      }
      return;
    }
    count++;
    emitTo(level, text);
  }

  // The worker runner's formatter (format.ts), plus DOM nodes and lists.
  function describeNode(node, quote) {
    if (node.nodeType === 1) {
      var tag = "<" + node.tagName.toLowerCase();
      if (node.id) tag += ' id="' + node.id + '"';
      var cls = node.getAttribute("class");
      if (cls) tag += ' class="' + cls + '"';
      return tag + ">";
    }
    if (node.nodeType === 3) return "#text " + quote(node.textContent);
    if (node.nodeType === 9) return "#document";
    return node.nodeName;
  }
  // Some compilers (esbuild's keepNames, used by tsx) wrap functions in
  // __name(fn, "name") calls inside the copied source.
  var __name = function (fn) { return fn; };
  var formatter = (__FORMATTER__)(function (value, quote) {
    if (typeof Node !== "undefined" && value instanceof Node) return describeNode(value, quote);
    var isList = typeof NodeList !== "undefined" &&
      (value instanceof NodeList || value instanceof HTMLCollection);
    if (!isList) return undefined;
    var items = Array.prototype.map.call(value, function (n) { return describeNode(n, quote); });
    var label = value.constructor.name + "(" + items.length + ") ";
    return items.length ? label + "[ " + items.join(", ") + " ]" : label + "[]";
  });
  function formatArgs(args) { return formatter.formatArgs(args); }
  // Printed proxies show their target, like Node (no traps run).
  window.Proxy = formatter.trackProxies(window.Proxy);
  window.__pandaFormat = formatArgs;

  ["log", "info", "warn", "error", "debug", "table"].forEach(function (method) {
    var level = method === "debug" || method === "table" ? "log" : method;
    console[method] = function () { emit(level, formatArgs(arguments)); };
  });

  // Loops get a __pandaLoop() call (see loop-guard.ts). The clock starts at
  // the first loop step in a task and resets once that task is over.
  var loopStart = 0;
  var loopSteps = 0;
  window.__pandaLoop = function () {
    if (loopStart === 0) {
      loopStart = Date.now();
      Promise.resolve().then(function () { loopStart = 0; });
    } else if (++loopSteps % 1000 === 0 && Date.now() - loopStart > LOOP_LIMIT_MS) {
      var error = new RangeError("Stopped a loop that ran for over 2 seconds. Is it an infinite loop?");
      // Point at the learner's loop (the caller), not at this function.
      var caller = /:(\d+):\d+\)?\s*$/.exec(String(error.stack).split("\n")[2] || "");
      error.pandaLine = caller ? Number(caller[1]) : 0;
      throw error;
    }
  };

  // Browsers number the lines of an inserted script from different starting
  // points; a one-line probe inserted the same way tells us the offset.
  var lineBase = 0;
  function insertScript(text) {
    var script = document.createElement("script");
    script.textContent = text;
    document.body.appendChild(script);
    script.remove();
  }

  function report(name, message, line) {
    line = line ? line - lineBase : 0;
    if (!firstError) firstError = { name: name, message: message, line: line > 0 ? line : undefined };
    emit("error", name + ": " + message);
  }

  window.addEventListener("error", function (event) {
    var error = event.error;
    if (error && typeof error === "object" && "message" in error) {
      report(error.name || "Error", error.message, error.pandaLine || event.lineno);
    } else {
      report("Error", String(event.message).replace(/^Uncaught (\w+: )?/, ""), event.lineno);
    }
  });
  window.addEventListener("unhandledrejection", function (event) {
    var reason = event.reason;
    emit("error", "Uncaught (in promise) " +
      (reason instanceof Error ? reason.name + ": " + reason.message : String(reason)));
  });

  // The preview's origin is sandboxed, so the real localStorage is off
  // limits. This in-memory one starts from data the parent page kept from
  // earlier runs and reports every change, so saved data survives pressing
  // Run again, just like reloading a real page.
  var stored = Object.create(null);
  var onStorageChange = function () {};
  var memoryStorage = {
    getItem: function (key) {
      key = String(key);
      return key in stored ? stored[key] : null;
    },
    setItem: function (key, value) {
      stored[String(key)] = String(value);
      onStorageChange(Object.assign({}, stored));
    },
    removeItem: function (key) {
      delete stored[String(key)];
      onStorageChange(Object.assign({}, stored));
    },
    clear: function () {
      stored = Object.create(null);
      onStorageChange({});
    },
    key: function (index) {
      var keys = Object.keys(stored);
      return index < keys.length ? keys[index] : null;
    },
    get length() {
      return Object.keys(stored).length;
    },
  };
  try {
    Object.defineProperty(window, "localStorage", { value: memoryStorage, configurable: true });
  } catch (e) {}

  // import … from "react" becomes require("react") (see prepareDomCode).
  window.exports = {};
  window.require = function (name) {
    var modules = window.__pandaModules || {};
    if (Object.prototype.hasOwnProperty.call(modules, name)) return modules[name];
    throw new Error("Cannot find module '" + name + "'. The preview can import: " +
      (Object.keys(modules).join(", ") || "nothing on this page"));
  };

  // fetch() to https://api.pandadev.test is answered by the runner's practice
  // API (through fetchBridge), after the delay the API asks for.
  var API_ORIGIN = "https://api.pandadev.test";
  var fetchBridge = null;
  var inflight = 0;
  var realFetch = window.fetch;
  window.__requests = [];
  window.fetch = function (input, init) {
    var request;
    var signal = init && init.signal;
    try {
      // The signal is handled here (some Request versions only accept their own).
      var options = init ? Object.assign({}, init) : undefined;
      if (options) delete options.signal;
      request = new Request(input, options);
    } catch (e) {
      return Promise.reject(e);
    }
    if (!fetchBridge || new URL(request.url).origin !== API_ORIGIN) {
      return realFetch ? realFetch.call(window, input, init) : Promise.reject(new TypeError("Failed to fetch"));
    }
    inflight++;
    requestsStarted++;
    var finished = false;
    var done = function () {
      if (!finished) { finished = true; inflight--; }
    };
    var body = request.method === "GET" || request.method === "HEAD" ? Promise.resolve("") : request.text();
    return body.then(function (text) {
      if (text === "") text = undefined;
      var headers = {};
      request.headers.forEach(function (value, key) { headers[key] = value; });
      var logged = text;
      try { logged = text === undefined ? undefined : JSON.parse(text); } catch (e) {}
      window.__requests.push({ method: request.method, url: request.url, headers: headers, body: logged });
      if (signal && signal.aborted) throw signal.reason;
      return fetchBridge({ method: request.method, url: request.url, headers: headers, body: text });
    }).then(function (fake) {
      // __hold(): answers wait until the check calls __release().
      if (held) return new Promise(function (go) { held.push(function () { go(fake); }); });
      return fake;
    }).then(function (fake) {
      return new Promise(function (resolve, reject) {
        var id = setTimeout(function () {
          if (fake.networkError) return reject(new TypeError("Failed to fetch"));
          var response = new Response(fake.body, { status: fake.status, statusText: fake.statusText, headers: fake.headers });
          Object.defineProperty(response, "url", { value: request.url });
          resolve(response);
        }, fake.delayMs);
        if (signal) signal.addEventListener("abort", function () {
          clearTimeout(id);
          reject(signal.reason);
        });
      });
    }).then(function (response) {
      done();
      return response;
    }, function (error) {
      done();
      throw error;
    });
  };

  function macrotask(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms || 0); });
  }
  // Waits until requests have answered and the page (e.g. React) has updated.
  // Waits until no request is in flight and none has started for quietMs,
  // so renders, effects and the requests they start have all finished.
  // (React may run a first render's effects a while after the render.)
  var requestsStarted = 0;
  async function settle(quietMs) {
    var quiet = quietMs || 40;
    var until = Date.now() + 3000;
    var seen = -1;
    var calmSince = 0;
    while (Date.now() < until) {
      await macrotask(0);
      // WebSocket messages on their way count too (see build-vendor.mjs).
      var busy = inflight + (window.__pandaWsPending ? window.__pandaWsPending() : 0);
      if (busy > 0 || requestsStarted !== seen) {
        seen = requestsStarted;
        calmSince = busy > 0 ? 0 : Date.now();
        await macrotask(10);
        continue;
      }
      if (calmSince === 0) calmSince = Date.now();
      if (Date.now() - calmSince >= quiet) return;
      await macrotask(10);
    }
  }
  function find(target) {
    var el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) throw new Error("No element matches " + String(target));
    return el;
  }
  // Helpers for checks: click or type like a person, then wait for the page.
  window.__settle = function () { return settle(); };
  // Hold practice-API answers, e.g. to check a loading state without racing
  // the response; __release(value) lets them through, waits, returns value.
  var held = null;
  window.__hold = function () {
    held = held || [];
  };
  window.__release = async function (value) {
    var waiting = held || [];
    held = null;
    waiting.forEach(function (go) { go(); });
    await settle();
    return value;
  };
  // Waits (up to ms) until test() is true; returns whether it became true.
  window.__waitFor = async function (test, ms) {
    var until = Date.now() + (ms || 2000);
    for (;;) {
      try { if (test()) return true; } catch (e) {}
      if (Date.now() > until) return false;
      await macrotask(5);
    }
  };
  window.__click = function (target) {
    find(target).click();
    return settle();
  };
  window.__type = function (target, text) {
    var el = find(target);
    var proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype
      : HTMLInputElement.prototype;
    // Set the value the way the browser does, so React notices the change.
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, String(text));
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return settle();
  };

  window.__pandaRun = async function (code, checks, emitLine, storage, onStorage, bridge) {
    emitTo = emitLine;
    stored = Object.assign(Object.create(null), storage || {});
    if (onStorage) onStorageChange = onStorage;
    if (bridge) fetchBridge = bridge;
    insertScript("window.__pandaProbe = new Error().stack;");
    var probe = /:(\d+):\d+\)?\s*$/m.exec(String(window.__pandaProbe).split("\n")[1] || "");
    lineBase = probe ? Number(probe[1]) - 1 : 0;
    insertScript(code);
    // Let promise callbacks, zero-delay timers, requests and renders finish
    // (longer at the start: first effects may start their requests late).
    await settle(150);
    var error = firstError;
    var tests = [];
    for (var i = 0; i < checks.length; i++) {
      if (error) {
        tests.push({ passed: false, error: "Fix the error in your code first." });
        continue;
      }
      try {
        // Checks may await, e.g. (await __click("button"), …).
        var value = await (0, eval)("(async () => (" + checks[i] + "))()");
        tests.push({ passed: Boolean(value) });
      } catch (e) {
        tests.push({ passed: false, error: e && e.name ? e.name + ": " + e.message : String(e) });
      }
    }
    return { error: error, tests: tests };
  };

  if (window.parent !== window) {
    window.addEventListener("message", function (event) {
      var data = event.data;
      if (event.source !== window.parent || !data || data.type !== "panda-run") return;
      var post = function (message) {
        message.token = data.token;
        window.parent.postMessage(message, "*");
      };
      var waiting = {};
      var nextId = 1;
      window.addEventListener("message", function (reply) {
        var answer = reply.data;
        if (reply.source !== window.parent || !answer || answer.type !== "panda-fetch" || answer.token !== data.token) return;
        var resolve = waiting[answer.id];
        delete waiting[answer.id];
        if (resolve) resolve(answer.response);
      });
      var bridge = function (request) {
        return new Promise(function (resolve) {
          var id = nextId++;
          waiting[id] = resolve;
          post({ type: "fetch", id: id, request: request });
        });
      };
      window.__pandaRun(data.code, data.checks, function (level, text) {
        post({ type: "line", line: { level: level, text: text } });
      }, data.storage, function (snapshot) {
        post({ type: "storage", data: snapshot });
      }, bridge).then(function (result) {
        post({ type: "done", result: result });
      });
    });
  }
})();
`
  .replace("__MAX_LINES__", String(MAX_OUTPUT_LINES))
  .replace("__FORMATTER__", () => createFormatter.toString());

/** Default look for the preview, matching the site's dark theme. */
const PREVIEW_STYLES = `
:root { color-scheme: dark; }
body { margin: 0; padding: 16px; font: 15px/1.5 system-ui, sans-serif; color: #e8e8f3; background: #0b0d1f; }
button { font: inherit; cursor: pointer; padding: 6px 14px; border-radius: 8px; border: 1px solid rgb(255 255 255 / 0.2); background: #7c3aed; color: #fff; }
button:hover { background: #8b5cf6; }
input, select, textarea { font: inherit; padding: 6px 10px; border-radius: 8px; border: 1px solid rgb(255 255 255 / 0.2); background: rgb(255 255 255 / 0.06); color: inherit; }
a { color: #22d3ee; }
`;

/**
 * The whole preview page: styles, any library scripts (`head`, e.g. React),
 * the harness, then the lesson's HTML.
 */
export function previewDocument(html: string, head = "") {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${PREVIEW_STYLES}</style>${head}<script>${HARNESS}</script></head><body>${html}</body></html>`;
}

/** The page React exercises render into when they don't bring their own. */
export const REACT_HTML = '<div id="root"></div>';

const MODULE_SYNTAX = /^\s*(import\s*[\w{*'"]|export\s)/m;

/**
 * Learner code as the preview runs it: strict, with loop guards. React code
 * has its JSX turned into React.createElement calls, and imports into
 * require() calls the page answers; line numbers stay the same.
 */
export function prepareDomCode(
  code: string,
  options: { react?: boolean } = {},
) {
  const transforms: Transform[] = [];
  if (options.react) transforms.push("jsx");
  if (MODULE_SYNTAX.test(code)) transforms.push("imports");
  if (transforms.length) {
    try {
      code = transform(code, {
        transforms,
        jsxPragma: "React.createElement",
        jsxFragmentPragma: "React.Fragment",
        production: true,
        disableESTransforms: true,
      }).code;
    } catch (error) {
      // Report the syntax error from inside the page, like the browser
      // would, thrown from the line it's on.
      const text = error instanceof Error ? error.message : String(error);
      const where = /\s*\((\d+):\d+\)$/.exec(text);
      const line = where ? Number(where[1]) : 1;
      const message = where ? text.slice(0, where.index) : text;
      return `${"\n".repeat(line - 1)}throw new SyntaxError(${JSON.stringify(message)});`;
    }
  }
  return `"use strict";${addLoopGuards(code)}`;
}

export type DomRunResult = {
  error: { name: string; message: string; line?: number } | null;
  tests: { passed: boolean; error?: string }[];
};
