import { transform } from "sucrase";

import { formatArgs } from "./format";

export type RunLanguage = "javascript" | "typescript" | "python";
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
};

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

  const push = (level: LogLevel, args: unknown[]) => {
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
    const line: OutputLine = { level, text: formatArgs(args) };
    output.push(line);
    if (level !== "error" && level !== "warn") texts.push(line.text);
    onLine?.(line);
  };

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
    code =
      language === "typescript"
        ? transform(source, {
            transforms: ["typescript"],
            disableESTransforms: true,
          }).code
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

  const timers = {
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

  const params = [
    "console",
    "setTimeout",
    "clearTimeout",
    "setInterval",
    "clearInterval",
    "__output",
  ];
  const testThunks = tests.map((t) => `() => (${t.check})`).join(",\n");
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
      texts,
    );
    // A top-level `return` in the learner's code skips our list of tests.
    thunks = Array.isArray(returned) ? (returned as (() => unknown)[]) : [];
  } catch (e) {
    error = toRunError(e, codeLines);
    push("error", [`${error.name}: ${error.message}`]);
  }

  // Let promise callbacks and timers finish.
  await new Promise((resolve) => setTimeout(resolve, 0));
  if (pending > 0) {
    await new Promise<void>((resolve) => {
      notifyIdle = resolve;
    });
  }
  error ??= asyncError;

  if (tests.length === 0) return { output, error };

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
  return { output, error, tests: results };
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
