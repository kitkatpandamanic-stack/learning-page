import {
  execute,
  type OutputLine,
  type RunLanguage,
  type TestSpec,
} from "./execute";

export type WorkerRequest = {
  code: string;
  language: RunLanguage;
  tests?: TestSpec[];
};

export type WorkerMessage =
  | { type: "line"; line: OutputLine }
  | { type: "done"; result: Awaited<ReturnType<typeof execute>> };

// The project's TypeScript lib is "dom", so describe the worker scope we use.
const scope = self as unknown as {
  postMessage(message: WorkerMessage): void;
  addEventListener(
    type: "unhandledrejection",
    listener: (event: PromiseRejectionEvent) => void,
  ): void;
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
};

const post = (message: WorkerMessage) => scope.postMessage(message);

// Promise rejections nobody handled, e.g. a failing fetch without try/catch.
scope.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  post({
    type: "line",
    line: {
      level: "error",
      text: `Uncaught (in promise) ${reason instanceof Error ? `${reason.name}: ${reason.message}` : String(reason)}`,
    },
  });
});

scope.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { code, language, tests } = event.data;
  const result = await execute(code, {
    language,
    tests,
    onLine: (line) => post({ type: "line", line }),
  });
  post({ type: "done", result });
};
