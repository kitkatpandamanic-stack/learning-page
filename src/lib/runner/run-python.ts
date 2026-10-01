import type { OutputLine, TestSpec } from "./execute";
import { parsePythonResult, pythonLine } from "./execute-python";
import { pythonWorkerSource } from "./python-worker-source";
import type { RunResult, RunStatus } from "./run-code";

type PythonMessage =
  | { type: "ready" }
  | { type: "load-error"; message: string }
  | { type: "installing"; id: number; packages: string }
  | { type: "started"; id: number }
  | { type: "line"; id: number; level: string; text: string }
  | { type: "done"; id: number; raw: string };

export const PYTHON_RUN_TIMEOUT_MS = 5000;
// Checks may run the learner's pytest suite several times, so they get longer.
export const PYTHON_CHECK_TIMEOUT_MS = 15_000;
// Pyodide is about 10 MB (pandas about 15 MB more); give slow mobile
// connections time to download it.
const LOAD_TIMEOUT_MS = 120_000;

/**
 * One long-lived Python worker for the whole page, because loading Pyodide
 * takes a few seconds. A run that takes too long kills the worker; the next
 * run starts a fresh one.
 */
let worker: Worker | null = null;
let ready = false;
let nextId = 1;
const readyListeners = new Set<(error?: string) => void>();
const handlers = new Map<number, (message: PythonMessage) => void>();
/** Ends a pending run with a message, used when the worker is restarted. */
const aborters = new Map<number, (message: string) => void>();

function getWorker() {
  if (worker) return worker;
  const url = URL.createObjectURL(
    new Blob([pythonWorkerSource()], { type: "text/javascript" }),
  );
  worker = new Worker(url, { type: "module" });
  ready = false;
  worker.onmessage = (event: MessageEvent<PythonMessage>) => {
    const message = event.data;
    if (message.type === "ready" || message.type === "load-error") {
      URL.revokeObjectURL(url); // the module has loaded; the URL is no longer needed
      ready = message.type === "ready";
      readyListeners.forEach((fn) =>
        fn(message.type === "load-error" ? message.message : undefined),
      );
      readyListeners.clear();
      if (message.type === "load-error") killWorker();
      return;
    }
    handlers.get(message.id)?.(message);
  };
  return worker;
}

function killWorker() {
  worker?.terminate();
  worker = null;
  ready = false;
  // Other runs waiting on this worker would never finish now.
  for (const abort of [...aborters.values()]) {
    abort("Python was restarted. Please run your code again.");
  }
}

/** Start downloading Pyodide early, e.g. when a Python editor appears. */
export function preloadPython() {
  getWorker();
}

export function isPythonReady() {
  return ready;
}

export function runPython(
  code: string,
  options: {
    tests?: TestSpec[];
    timeoutMs?: number;
    onLine?: (line: OutputLine) => void;
    onStatus?: (status: RunStatus, detail?: string) => void;
  } = {},
): { result: Promise<RunResult>; cancel: () => void } {
  const {
    tests,
    timeoutMs = tests?.length ? PYTHON_CHECK_TIMEOUT_MS : PYTHON_RUN_TIMEOUT_MS,
    onLine,
    onStatus,
  } = options;
  const id = nextId++;
  const lines: OutputLine[] = [];
  let started = performance.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let finish: (r: RunResult) => void = () => {};

  const result = new Promise<RunResult>((resolve) => {
    finish = (r) => {
      clearTimeout(timer);
      handlers.delete(id);
      aborters.delete(id);
      resolve(r);
    };
  });

  const stopped = (message: string, kill: boolean): RunResult => {
    if (kill) {
      aborters.delete(id); // this run reports its own reason, not "restarted"
      killWorker();
    }
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

  aborters.set(id, (message) => finish(stopped(message, false)));
  const w = getWorker();
  if (!ready) {
    onStatus?.("loading");
    timer = setTimeout(
      () =>
        finish(
          stopped(
            "Python took too long to load. Check your connection and try again.",
            true,
          ),
        ),
      LOAD_TIMEOUT_MS,
    );
    readyListeners.add((error) => {
      if (error) finish(stopped(`Python couldn't load: ${error}`, false));
    });
  }

  handlers.set(id, (message) => {
    if (message.type === "installing") {
      onStatus?.("installing", message.packages);
      clearTimeout(timer);
      timer = setTimeout(
        () =>
          finish(
            stopped(
              "Python packages took too long to download. Check your connection and try again.",
              true,
            ),
          ),
        LOAD_TIMEOUT_MS,
      );
    } else if (message.type === "started") {
      started = performance.now(); // downloads don't count as running time
      onStatus?.("running");
      clearTimeout(timer);
      timer = setTimeout(
        () =>
          finish(
            stopped(
              `Stopped after ${timeoutMs / 1000} seconds. Is there an infinite loop?`,
              true,
            ),
          ),
        timeoutMs,
      );
    } else if (message.type === "line") {
      const line = pythonLine(message.level, message.text);
      lines.push(line);
      onLine?.(line);
    } else if (message.type === "done") {
      finish({
        ...parsePythonResult(message.raw, tests ?? [], lines),
        timedOut: false,
        durationMs: performance.now() - started,
      });
    }
  });

  w.postMessage({ id, code, checks: (tests ?? []).map((t) => t.check) });

  return { result, cancel: () => finish(stopped("Stopped.", true)) };
}
