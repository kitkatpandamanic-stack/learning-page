import type { OutputLine, TestSpec } from "./execute";
import type { RunResult, RunStatus } from "./run-code";
import type { SqlMessage, SqlRequest } from "./sql.worker";

export const SQL_RUN_TIMEOUT_MS = 5000;
// Checks run more queries (and reruns) after the learner's code.
export const SQL_CHECK_TIMEOUT_MS = 10_000;
// PostgreSQL is about 5 MB to download the first time.
const LOAD_TIMEOUT_MS = 120_000;

/**
 * One long-lived SQL worker for the whole page, because PostgreSQL takes a
 * moment to start. A run that takes too long (say, a recursive query that
 * never ends) kills the worker; the next run starts a fresh one.
 */
let worker: Worker | null = null;
let ready = false;
let nextId = 1;
const readyListeners = new Set<(error?: string) => void>();
const handlers = new Map<number, (message: SqlMessage) => void>();
/** Ends a pending run with a message, used when the worker is restarted. */
const aborters = new Map<number, (message: string) => void>();

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL("./sql.worker.ts", import.meta.url), {
    type: "module",
  });
  ready = false;
  worker.onmessage = (event: MessageEvent<SqlMessage>) => {
    const message = event.data;
    if (message.type === "ready" || message.type === "load-error") {
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
  for (const abort of [...aborters.values()]) {
    abort("The database was restarted. Please run your code again.");
  }
}

/** Start PostgreSQL early, e.g. when a SQL editor appears. */
export function preloadSql() {
  getWorker();
}

export function isSqlReady() {
  return ready;
}

export function runSql(
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
    timeoutMs = tests?.length ? SQL_CHECK_TIMEOUT_MS : SQL_RUN_TIMEOUT_MS,
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
            "The database took too long to load. Check your connection and try again.",
            true,
          ),
        ),
      LOAD_TIMEOUT_MS,
    );
    readyListeners.add((error) => {
      if (error) finish(stopped(`The database couldn't load: ${error}`, false));
    });
  }

  handlers.set(id, (message) => {
    if (message.type === "started") {
      started = performance.now(); // loading doesn't count as running time
      onStatus?.("running");
      clearTimeout(timer);
      timer = setTimeout(
        () =>
          finish(
            stopped(
              `Stopped after ${timeoutMs / 1000} seconds. Does a query never finish?`,
              true,
            ),
          ),
        timeoutMs,
      );
    } else if (message.type === "line") {
      lines.push(message.line);
      onLine?.(message.line);
    } else if (message.type === "done") {
      finish({
        ...message.result,
        output: lines,
        timedOut: false,
        durationMs: performance.now() - started,
      });
    }
  });

  w.postMessage({ id, code, tests: tests ?? [] } satisfies SqlRequest);

  return { result, cancel: () => finish(stopped("Stopped.", true)) };
}
