import type {
  ExecuteResult,
  OutputLine,
  RunLanguage,
  TestSpec,
} from "./execute";
import { runPython } from "./run-python";
import { typecheck } from "./run-typecheck";
import type { WorkerMessage, WorkerRequest } from "./runner.worker";
import { typeErrorResult, type TypeDiagnostic } from "./typecheck";

export type RunResult = ExecuteResult & {
  timedOut: boolean;
  durationMs: number;
  /** TypeScript only: type errors, for underlining in the editor */
  diagnostics?: TypeDiagnostic[];
  /** Shown beside the output, e.g. when types couldn't be checked */
  notice?: string;
};

export const RUN_TIMEOUT_MS = 3000;

/** "loading" while Python or the TypeScript checker downloads the first time */
export type RunStatus = "loading" | "running";

type RunOptions = {
  language?: RunLanguage;
  tests?: TestSpec[];
  timeoutMs?: number;
  onLine?: (line: OutputLine) => void;
  onStatus?: (status: RunStatus) => void;
};

type Run = { result: Promise<RunResult>; cancel: () => void };

/**
 * Runs learner code without freezing the page: JavaScript in a fresh Web
 * Worker, TypeScript after a type check, Python with Pyodide.
 */
export function runCode(code: string, options: RunOptions = {}): Run {
  if (options.language === "python") return runPython(code, options);
  if (options.language === "typescript") return runTypeScript(code, options);
  return runInWorker(code, options);
}

/**
 * Type-checks first, like the TypeScript compiler would: code with type
 * errors doesn't run. If the checker can't load, the code runs unchecked.
 */
function runTypeScript(code: string, options: RunOptions): Run {
  const started = performance.now();
  let inner: Run | null = null;
  let cancelled = false;
  let stop: () => void = () => {};
  const cancelledResult = new Promise<RunResult>((resolve) => {
    stop = () =>
      resolve({
        output: [{ level: "error", text: "Stopped." }],
        error: { name: "TimeoutError", message: "Stopped." },
        timedOut: true,
        durationMs: performance.now() - started,
      });
  });

  const checked = typecheck(code, () => options.onStatus?.("loading")).then(
    (diagnostics: TypeDiagnostic[] | null): Promise<RunResult> => {
      if (cancelled) return cancelledResult;
      options.onStatus?.("running");
      if (diagnostics?.length) {
        return Promise.resolve({
          ...typeErrorResult(diagnostics, options.tests),
          diagnostics,
          timedOut: false,
          durationMs: performance.now() - started,
        });
      }
      inner = runInWorker(code, options);
      return inner.result.then((r) =>
        diagnostics === null ? { ...r, notice: UNCHECKED_NOTICE } : r,
      );
    },
  );

  return {
    result: Promise.race([checked, cancelledResult]),
    cancel: () => {
      cancelled = true;
      if (inner) inner.cancel();
      else stop();
    },
  };
}

const UNCHECKED_NOTICE =
  "Couldn't load the TypeScript checker, so types weren't checked this time.";

function runInWorker(code: string, options: RunOptions): Run {
  const {
    language = "javascript",
    tests,
    timeoutMs = RUN_TIMEOUT_MS,
    onLine,
  } = options;
  const worker = new Worker(new URL("./runner.worker.ts", import.meta.url), {
    type: "module",
  });
  const started = performance.now();
  const lines: OutputLine[] = [];
  let finish: (result: RunResult) => void = () => {};

  const result = new Promise<RunResult>((resolve) => {
    finish = (r) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(r);
    };
  });

  const stopped = (message: string): RunResult => ({
    output: [...lines, { level: "error", text: message }],
    error: { name: "TimeoutError", message },
    tests: tests?.map((t) => ({
      name: t.name,
      passed: false,
      error: "Your code didn't finish.",
    })),
    timedOut: true,
    durationMs: performance.now() - started,
  });

  const timer = setTimeout(
    () =>
      finish(
        stopped(
          `Stopped after ${timeoutMs / 1000} seconds. Is there an infinite loop?`,
        ),
      ),
    timeoutMs,
  );

  worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const message = event.data;
    if (message.type === "line") {
      lines.push(message.line);
      onLine?.(message.line);
    } else {
      finish({
        ...message.result,
        // Keep lines that arrived outside execute() (unhandled rejections).
        output:
          lines.length >= message.result.output.length
            ? lines
            : message.result.output,
        timedOut: false,
        durationMs: performance.now() - started,
      });
    }
  };
  worker.onerror = (event) => {
    event.preventDefault();
    finish(stopped(event.message || "The code runner crashed."));
  };

  worker.postMessage({ code, language, tests } satisfies WorkerRequest);

  return { result, cancel: () => finish(stopped("Stopped.")) };
}
