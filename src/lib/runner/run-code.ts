import type {
  ExecuteResult,
  OutputLine,
  RunLanguage,
  TestSpec,
} from "./execute";
import { runPython, type PythonStatus } from "./run-python";
import type { WorkerMessage, WorkerRequest } from "./runner.worker";

export type RunResult = ExecuteResult & {
  timedOut: boolean;
  durationMs: number;
};

export const RUN_TIMEOUT_MS = 3000;

/**
 * Runs code in a fresh Web Worker so it can't freeze the page, and kills it if
 * it runs too long (e.g. an infinite loop).
 */
export function runCode(
  code: string,
  options: {
    language?: RunLanguage;
    tests?: TestSpec[];
    timeoutMs?: number;
    onLine?: (line: OutputLine) => void;
    /** Python only: reports "loading" while Pyodide downloads */
    onStatus?: (status: PythonStatus) => void;
  } = {},
): { result: Promise<RunResult>; cancel: () => void } {
  if (options.language === "python") return runPython(code, options);

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
