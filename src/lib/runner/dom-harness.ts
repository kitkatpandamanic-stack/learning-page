import { MAX_OUTPUT_LINES } from "./execute";
import { addLoopGuards } from "./loop-guard";

/**
 * Runs inside the preview page, before the learner's HTML. It captures the
 * console (formatted like format.ts, which a test keeps in sync), reports
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
  var MAX_DEPTH = 2;
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

  function quote(s) {
    return "'" + s.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n") + "'";
  }

  function isPlainKey(key) {
    return /^[A-Za-z_$][\w$]*$/.test(key);
  }

  function describeNode(node) {
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

  function inspect(value, depth, seen) {
    if (value === null) return "null";
    switch (typeof value) {
      case "string": return depth === 0 ? value : quote(value);
      case "number": return Object.is(value, -0) ? "-0" : String(value);
      case "bigint": return value + "n";
      case "undefined": return "undefined";
      case "boolean": return String(value);
      case "symbol": return value.toString();
      case "function":
        return value.name ? "[Function: " + value.name + "]" : "[Function (anonymous)]";
    }
    if (seen.has(value)) return "[Circular]";
    if (value instanceof Error) {
      return (value.stack && value.stack.indexOf(value.name) === 0)
        ? value.stack.split("\n")[0]
        : value.name + ": " + value.message;
    }
    if (value instanceof Date) return isNaN(value.getTime()) ? "Invalid Date" : value.toISOString();
    if (value instanceof RegExp) return value.toString();
    if (typeof Node !== "undefined" && value instanceof Node) return describeNode(value);

    var nested = depth + 1;
    seen.add(value);
    try {
      var isList = typeof NodeList !== "undefined" &&
        (value instanceof NodeList || value instanceof HTMLCollection);
      if (Array.isArray(value) || isList) {
        var items = Array.prototype.slice.call(value);
        var label = isList ? value.constructor.name + "(" + items.length + ") " : "";
        if (items.length === 0) return label + "[]";
        if (depth > MAX_DEPTH) return isList ? "[" + value.constructor.name + "]" : "[Array]";
        return label + "[ " + items.map(function (v) { return inspect(v, nested, seen); }).join(", ") + " ]";
      }
      if (value instanceof Map) {
        if (depth > MAX_DEPTH) return "[Map]";
        var entries = [];
        value.forEach(function (v, k) { entries.push(inspect(k, nested, seen) + " => " + inspect(v, nested, seen)); });
        return "Map(" + value.size + ") {" + (entries.length ? " " + entries.join(", ") + " " : "") + "}";
      }
      if (value instanceof Set) {
        if (depth > MAX_DEPTH) return "[Set]";
        var members = [];
        value.forEach(function (v) { members.push(inspect(v, nested, seen)); });
        return "Set(" + value.size + ") {" + (members.length ? " " + members.join(", ") + " " : "") + "}";
      }
      var proto = Object.getPrototypeOf(value);
      var ctor = proto && proto.constructor;
      var named = ctor && ctor !== Object && typeof ctor.name === "string" && ctor.name;
      var prefix = named ? ctor.name + " " : "";
      var keys = Object.keys(value);
      if (keys.length === 0) return prefix + "{}";
      if (depth > MAX_DEPTH) return named ? "[" + ctor.name + "]" : "[Object]";
      return prefix + "{ " + keys.map(function (key) {
        return (isPlainKey(key) ? key : quote(key)) + ": " + inspect(value[key], nested, seen);
      }).join(", ") + " }";
    } finally {
      seen.delete(value);
    }
  }

  function formatArgs(args) {
    return Array.prototype.map.call(args, function (a) { return inspect(a, 0, new Set()); }).join(" ");
  }
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

  window.__pandaRun = async function (code, checks, emitLine, storage, onStorage) {
    emitTo = emitLine;
    stored = Object.assign(Object.create(null), storage || {});
    if (onStorage) onStorageChange = onStorage;
    insertScript("window.__pandaProbe = new Error().stack;");
    var probe = /:(\d+):\d+\)?\s*$/m.exec(String(window.__pandaProbe).split("\n")[1] || "");
    lineBase = probe ? Number(probe[1]) - 1 : 0;
    insertScript(code);
    // Let promise callbacks and zero-delay timers run before checking.
    await new Promise(function (resolve) { setTimeout(resolve, 0); });
    var error = firstError;
    var tests = [];
    for (var i = 0; i < checks.length; i++) {
      if (error) {
        tests.push({ passed: false, error: "Fix the error in your code first." });
        continue;
      }
      try {
        var value = (0, eval)("(" + checks[i] + ")");
        if (value && typeof value.then === "function") value = await value;
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
      window.__pandaRun(data.code, data.checks, function (level, text) {
        post({ type: "line", line: { level: level, text: text } });
      }, data.storage, function (snapshot) {
        post({ type: "storage", data: snapshot });
      }).then(function (result) {
        post({ type: "done", result: result });
      });
    });
  }
})();
`.replace("__MAX_LINES__", String(MAX_OUTPUT_LINES));

/** Default look for the preview, matching the site's dark theme. */
const PREVIEW_STYLES = `
:root { color-scheme: dark; }
body { margin: 0; padding: 16px; font: 15px/1.5 system-ui, sans-serif; color: #e8e8f3; background: #0b0d1f; }
button { font: inherit; cursor: pointer; padding: 6px 14px; border-radius: 8px; border: 1px solid rgb(255 255 255 / 0.2); background: #7c3aed; color: #fff; }
button:hover { background: #8b5cf6; }
input, select, textarea { font: inherit; padding: 6px 10px; border-radius: 8px; border: 1px solid rgb(255 255 255 / 0.2); background: rgb(255 255 255 / 0.06); color: inherit; }
a { color: #22d3ee; }
`;

/** The whole preview page: styles, the harness, then the lesson's HTML. */
export function previewDocument(html: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${PREVIEW_STYLES}</style><script>${HARNESS}</script></head><body>${html}</body></html>`;
}

/** Learner code as the preview runs it: strict, with loop guards. */
export function prepareDomCode(code: string) {
  return `"use strict";${addLoopGuards(code)}`;
}

export type DomRunResult = {
  error: { name: string; message: string; line?: number } | null;
  tests: { passed: boolean; error?: string }[];
};
