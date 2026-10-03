import { transform, type Transform } from "sucrase";

import {
  createCookieParserModule,
  createExpressModule,
  createSupertestModule,
} from "./express-shim";
import { createFakeApi, createFetch, type RequestLogEntry } from "./fake-api";
import { createFormatter, formatArgs } from "./format";
import {
  createVitest,
  type TimerFunctions,
  type VitestSummary,
} from "./vitest-shim";
import { createWsNetwork } from "./ws-shim";

/** "react" is JavaScript with JSX, run in the live preview with React loaded. */
export type RunLanguage = "javascript" | "typescript" | "python" | "react";
export type LogLevel = "log" | "info" | "warn" | "error";
export type OutputLine = {
  level: LogLevel;
  text: string;
  /** A chart drawn by the code (a data: URL); `text` is then empty */
  image?: string;
};

/** A check run after the learner's code, in the same scope, e.g. `add(2, 3) === 5`. */
export type TestSpec = { name: string; check: string };
export type TestResult = { name: string; passed: boolean; error?: string };

export type RunError = { name: string; message: string; line?: number };

export type ExecuteResult = {
  output: OutputLine[];
  error?: RunError;
  tests?: TestResult[];
  /** When the code defined Vitest tests: how they went */
  vitest?: VitestSummary;
};

/** Code with import/export statements needs turning into require() calls. */
const MODULE_SYNTAX = /^\s*(import\s*[\w{*'"]|export\s)/m;

/** What `import … from "name"` can load in the editor (besides vitest). */
const MODULE_NAMES = [
  "express",
  "supertest",
  "cookie-parser",
  "ws",
  "http",
] as const;

export const MAX_OUTPUT_LINES = 500;

// User code becomes the body of an async function so top-level await works.
// `new AsyncFunction(...)` puts two lines of wrapper before the body.
const WRAPPER_LINES = 2;
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (
  ...args: string[]
) => (...args: unknown[]) => Promise<unknown>;

function errorLine(error: unknown, codeLines: number): number | undefined {
  const stack = error instanceof Error ? (error.stack ?? "") : "";
  const match =
    /<anonymous>:(\d+):\d+/.exec(stack) ?? /Function:(\d+):\d+/.exec(stack);
  if (!match) return undefined;
  const line = Number(match[1]) - WRAPPER_LINES;
  return line >= 1 && line <= codeLines ? line : undefined;
}

function toRunError(error: unknown, codeLines: number): RunError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      line: errorLine(error, codeLines),
    };
  }
  return { name: "Error", message: `Uncaught ${formatArgs([error])}` };
}

/**
 * Runs learner code with a captured console and tracked timers, waits for
 * pending timers to finish, then runs the tests. Works in a Web Worker and in
 * Node (for our own content tests). Infinite loops must be stopped by the
 * caller, e.g. by terminating the worker.
 */
export async function execute(
  source: string,
  options: {
    language?: RunLanguage;
    tests?: TestSpec[];
    onLine?: (line: OutputLine) => void;
  } = {},
): Promise<ExecuteResult> {
  const { language = "javascript", tests = [], onLine } = options;
  const output: OutputLine[] = [];
  const texts: string[] = [];
  let truncated = false;

  // Each run gets its own formatter: it tracks the run's proxies, and holds
  // back lines with promises for a microtask to show their state like Node.
  const formatter = createFormatter();
  const emit = (level: LogLevel, text: string) => {
    if (output.length >= MAX_OUTPUT_LINES) {
      if (!truncated) {
        truncated = true;
        const line: OutputLine = {
          level: "warn",
          text: `Output stopped after ${MAX_OUTPUT_LINES} lines.`,
        };
        output.push(line);
        onLine?.(line);
      }
      return;
    }
    const line: OutputLine = { level, text };
    output.push(line);
    if (level !== "error" && level !== "warn") texts.push(line.text);
    onLine?.(line);
  };
  const write = formatter.createConsoleWriter((level, text) =>
    emit(level as LogLevel, text),
  );
  const push = (level: LogLevel, args: unknown[]) => write(level, args);

  const fakeConsole = {
    log: (...a: unknown[]) => push("log", a),
    info: (...a: unknown[]) => push("info", a),
    debug: (...a: unknown[]) => push("log", a),
    warn: (...a: unknown[]) => push("warn", a),
    error: (...a: unknown[]) => push("error", a),
    table: (...a: unknown[]) => push("log", a),
  };

  // Track timers so we know when asynchronous code has finished.
  let pending = 0;
  let asyncError: RunError | undefined;
  let notifyIdle: (() => void) | undefined;
  const intervals = new Set<ReturnType<typeof setInterval>>();
  const timeouts = new Set<ReturnType<typeof setTimeout>>();

  let code: string;
  try {
    const transforms: Transform[] = [];
    if (language === "typescript") transforms.push("typescript");
    if (MODULE_SYNTAX.test(source)) transforms.push("imports");
    code = transforms.length
      ? transform(source, { transforms, disableESTransforms: true }).code
      : source;
  } catch (error) {
    return {
      output,
      error: {
        name: "SyntaxError",
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
  const codeLines = code.split("\n").length;

  const guard =
    (fn: (...args: unknown[]) => unknown) =>
    (...args: unknown[]) => {
      try {
        fn(...args);
      } catch (error) {
        asyncError ??= toRunError(error, codeLines);
        push("error", [`${asyncError.name}: ${asyncError.message}`]);
      }
    };
  const settle = () => {
    pending = Math.max(0, pending - 1);
    // Promise callbacks that run after this timer may start new timers
    // (e.g. a second `await wait(100)`), so give them a turn first.
    if (pending === 0) {
      setTimeout(() => {
        if (pending === 0) notifyIdle?.();
      }, 0);
    }
  };

  const tracked = {
    setTimeout: (
      fn: (...args: unknown[]) => unknown,
      ms?: number,
      ...args: unknown[]
    ) => {
      pending++;
      const id = setTimeout(() => {
        timeouts.delete(id);
        guard(fn)(...args);
        settle();
      }, ms);
      timeouts.add(id);
      return id;
    },
    clearTimeout: (id: ReturnType<typeof setTimeout>) => {
      if (timeouts.delete(id)) {
        clearTimeout(id);
        settle();
      }
    },
    setInterval: (
      fn: (...args: unknown[]) => unknown,
      ms?: number,
      ...args: unknown[]
    ) => {
      pending++;
      const id = setInterval(guard(fn), ms, ...args);
      intervals.add(id);
      return id;
    },
    clearInterval: (id: ReturnType<typeof setInterval>) => {
      if (intervals.delete(id)) {
        clearInterval(id);
        settle();
      }
    },
  };
  // vi.useFakeTimers() swaps the learner's timer functions for fake ones.
  let fakeTimers: TimerFunctions | null = null;
  const timers = {
    setTimeout: (
      fn: (...args: unknown[]) => unknown,
      ms?: number,
      ...args: unknown[]
    ) =>
      fakeTimers
        ? fakeTimers.setTimeout(fn, ms, ...args)
        : tracked.setTimeout(fn, ms, ...args),
    clearTimeout: (id: ReturnType<typeof setTimeout>) =>
      fakeTimers ? fakeTimers.clearTimeout(id) : tracked.clearTimeout(id),
    setInterval: (
      fn: (...args: unknown[]) => unknown,
      ms?: number,
      ...args: unknown[]
    ) =>
      fakeTimers
        ? fakeTimers.setInterval(fn, ms, ...args)
        : tracked.setInterval(fn, ms, ...args),
    clearInterval: (id: ReturnType<typeof setInterval>) =>
      fakeTimers ? fakeTimers.clearInterval(id) : tracked.clearInterval(id),
  };

  // fetch() answers https://api.pandadev.test itself; its delays always use
  // real (tracked) timers so the run waits for them.
  const requests: RequestLogEntry[] = [];
  const fetch = createFetch(
    createFakeApi(),
    (ms, signal) =>
      new Promise<void>((resolve, reject) => {
        const id = tracked.setTimeout(() => resolve(), ms);
        signal?.addEventListener("abort", () => {
          tracked.clearTimeout(id);
          reject(signal.reason);
        });
      }),
    requests,
  );

  // WebSocket servers and clients in this run talk over an in-memory network.
  // Each delivery is its own task, like on a real connection. A
  // MessageChannel gives tasks without the 4 ms minimum browsers put on
  // nested setTimeout(0) calls; pending deliveries keep the run going.
  const channel =
    typeof MessageChannel === "function" ? new MessageChannel() : null;
  const deliveries: (() => void)[] = [];
  if (channel) {
    channel.port1.onmessage = () => {
      const deliver = deliveries.shift();
      if (!deliver) return;
      guard(deliver)();
      settle();
    };
  }
  const network = createWsNetwork((fn) => {
    if (!channel) {
      tracked.setTimeout(fn, 0);
      return;
    }
    pending++;
    deliveries.push(fn);
    channel.port2.postMessage(null);
  });
  const modules: Record<(typeof MODULE_NAMES)[number], () => unknown> = {
    express: () =>
      createExpressModule({ createServer: () => network.createServer() }),
    supertest: createSupertestModule,
    "cookie-parser": createCookieParserModule,
    ws: () => network.ws,
    http: () => network.http,
  };

  const vitest = createVitest({
    print: (level, text) => push(level, [text]),
    setTimers: (fake) => {
      fakeTimers = fake;
    },
  });
  const vitestSummary: VitestSummary = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: [],
  };
  const require = (name: string) => {
    if (name === "vitest") return vitest.module;
    const bare = name.replace(/^node:/, "");
    const make = modules[bare as keyof typeof modules];
    if (!make) {
      throw new Error(
        `Cannot find module '${name}'. The editor can import: vitest, ${MODULE_NAMES.join(", ")}.`,
      );
    }
    return make();
  };
  /** For checks: runs the code again with some text replaced (e.g. a bug the learner's tests should catch) and returns the test results. */
  const retest = async (replacements: [string, string][]) => {
    let changed = source;
    for (const [from, to] of replacements) {
      if (!changed.includes(from)) {
        throw new Error(`Couldn't find ${JSON.stringify(from)} in the code`);
      }
      changed = changed.replace(from, () => to); // no $& patterns
    }
    const again = await execute(changed, { language });
    // Code that crashes before its tests run counts as a caught bug.
    if (again.error && !again.vitest) {
      return { total: 1, passed: 0, failed: 1, skipped: 0, tests: [] };
    }
    return (
      again.vitest ?? {
        ...vitestSummary,
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        tests: [],
      }
    );
  };

  // Printed proxies show their target, like Node (no traps run).
  const trackedProxy = formatter.trackProxies(Proxy);

  const params = [
    "console",
    "setTimeout",
    "clearTimeout",
    "setInterval",
    "clearInterval",
    "fetch",
    "WebSocket",
    "Proxy",
    "require",
    "exports",
    "__output",
    "__vitest",
    "__retest",
    "__requests",
  ];
  const testThunks = tests.map((t) => `async () => (${t.check})`).join(",\n");
  const body = `"use strict";${code}\n;return [${testThunks}];`;

  let thunks: (() => unknown)[] = [];
  let error: RunError | undefined;
  try {
    const fn = new AsyncFunction(...params, body);
    const returned: unknown = await fn(
      fakeConsole,
      timers.setTimeout,
      timers.clearTimeout,
      timers.setInterval,
      timers.clearInterval,
      fetch,
      network.WebSocket,
      trackedProxy,
      require,
      {},
      texts,
      vitestSummary,
      retest,
      requests,
    );
    // A top-level `return` in the learner's code skips our list of tests.
    thunks = Array.isArray(returned) ? (returned as (() => unknown)[]) : [];
  } catch (e) {
    error = toRunError(e, codeLines);
    push("error", [`${error.name}: ${error.message}`]);
  }

  // Let promise callbacks and timers finish.
  const idle = async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    if (pending > 0) {
      await new Promise<void>((resolve) => {
        notifyIdle = resolve;
      });
    }
  };
  await idle();
  vitest.cleanup();
  error ??= asyncError;
  const closeChannel = () => {
    channel?.port1.close();
    channel?.port2.close();
  };

  // Like `vitest run`: tests defined with it()/test() run once the code has.
  let summary: VitestSummary | undefined;
  if (!error && vitest.hasTests()) {
    summary = await vitest.run();
    Object.assign(vitestSummary, summary);
    await idle();
  }

  if (tests.length === 0) {
    closeChannel();
    return { output, error, vitest: summary };
  }

  const results: TestResult[] = [];
  for (const [i, test] of tests.entries()) {
    if (error || !thunks[i]) {
      results.push({
        name: test.name,
        passed: false,
        error: error
          ? "Fix the error in your code first."
          : "Your code stopped early (is there a `return` outside a function?).",
      });
      continue;
    }
    try {
      const value = await thunks[i]();
      results.push({ name: test.name, passed: Boolean(value) });
    } catch (e) {
      results.push({
        name: test.name,
        passed: false,
        error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
      });
    }
  }
  closeChannel();
  return { output, error, tests: results, vitest: summary };
}

/** Compares printed output with what the exercise expects (ignoring trailing spaces and blank lines). */
export function compareOutput(output: OutputLine[], expected: string) {
  const normalize = (lines: string[]) => {
    const trimmed = lines.map((l) => l.replace(/\s+$/, ""));
    while (trimmed.length && trimmed[trimmed.length - 1] === "") trimmed.pop();
    return trimmed;
  };
  const got = normalize(
    output
      .filter((l) => (l.level === "log" || l.level === "info") && !l.image)
      .flatMap((l) => l.text.split("\n")),
  );
  const want = normalize(expected.split("\n"));
  const firstDiff = want.findIndex((line, i) => got[i] !== line);
  const index =
    firstDiff === -1 && got.length !== want.length ? want.length : firstDiff;
  return {
    passed: index === -1,
    line: index + 1,
    expected: want[index],
    got: got[index],
  };
}
