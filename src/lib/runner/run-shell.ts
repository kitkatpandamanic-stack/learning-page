import type { OutputLine, TestSpec } from "./execute";
import type { RunResult, RunStatus } from "./run-code";

export const SHELL_RUN_TIMEOUT_MS = 5000;
// Checks may run more commands after the learner's.
export const SHELL_CHECK_TIMEOUT_MS = 10_000;

/**
 * The terminal (a small bash with git) loads on first use, about 100 kB, so
 * pages without one don't download it. It runs on the page itself: scripts
 * have no loops, so a run can't hang, and each one gets a fresh sandbox.
 */
let loading: Promise<typeof import("./execute-shell")> | null = null;
let ready = false;

function load() {
  loading ??= import("./execute-shell").then((module) => {
    ready = true;
    return module;
  });
  return loading;
}

/** Start loading the terminal early, e.g. when a terminal editor appears. */
export function preloadShell() {
  void load().catch(() => {
    loading = null;
  });
}

export function isShellReady() {
  return ready;
}

export function runShell(
  code: string,
  options: {
    setup?: string;
    tests?: TestSpec[];
    timeoutMs?: number;
    onLine?: (line: OutputLine) => void;
    onStatus?: (status: RunStatus, detail?: string) => void;
  } = {},
): { result: Promise<RunResult>; cancel: () => void } {
  const {
    setup,
    tests,
    timeoutMs = tests?.length ? SHELL_CHECK_TIMEOUT_MS : SHELL_RUN_TIMEOUT_MS,
    onLine,
    onStatus,
  } = options;
  const lines: OutputLine[] = [];
  let started = performance.now();
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let finish: (r: RunResult) => void = () => {};

  const result = new Promise<RunResult>((resolve) => {
    let done = false;
    finish = (r) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(r);
    };
  });

  const halt = (message: string): RunResult => {
    stopped = true;
    return {
      output: [...lines, { level: "error", text: message }],
      error: { name: "TimeoutError", message },
      tests: tests?.map((t) => ({
        name: t.name,
        passed: false,
        error: "Your code didn't finish.",
      })),
      timedOut: true,
      durationMs: performance.now() - started,
    };
  };

  if (!ready) onStatus?.("loading");
  load().then(
    async ({ executeShell }) => {
      if (stopped) return;
      started = performance.now();
      onStatus?.("running");
      timer = setTimeout(
        () => finish(halt(`Stopped after ${timeoutMs / 1000} seconds.`)),
        timeoutMs,
      );
      try {
        const res = await executeShell(code, {
          setup,
          tests,
          stopped: () => stopped,
          onLine: (line) => {
            lines.push(line);
            onLine?.(line);
          },
        });
        finish({
          ...res,
          output: lines,
          timedOut: false,
          durationMs: performance.now() - started,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        finish({
          output: [...lines, { level: "error", text: message }],
          error: { name: "Error", message },
          timedOut: false,
          durationMs: performance.now() - started,
        });
      }
    },
    (error: unknown) => {
      loading = null;
      const message = `The terminal couldn't load: ${error instanceof Error ? error.message : String(error)}`;
      finish({
        output: [{ level: "error", text: message }],
        error: { name: "Error", message },
        timedOut: false,
        durationMs: 0,
      });
    },
  );

  return { result, cancel: () => finish(halt("Stopped.")) };
}
