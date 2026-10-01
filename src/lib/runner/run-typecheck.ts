import type { TypeDiagnostic } from "./typecheck";
import type { TypeCheckMessage, TypeCheckRequest } from "./typecheck.worker";

const LOAD_TIMEOUT_MS = 60_000;
const CHECK_TIMEOUT_MS = 10_000;

/**
 * One long-lived type-checking worker for the whole page: TypeScript is a
 * large download, so it's fetched once, on the first TypeScript run.
 */
let worker: Worker | null = null;
let ready = false;
let failed = false;
let nextId = 1;
const pending = new Map<number, (message: TypeCheckMessage) => void>();
const readyListeners = new Set<(ok: boolean) => void>();

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL("./typecheck.worker.ts", import.meta.url), {
    type: "module",
  });
  worker.onmessage = (event: MessageEvent<TypeCheckMessage>) => {
    const message = event.data;
    if (message.type === "result") {
      pending.get(message.id)?.(message);
    } else {
      ready = message.type === "ready";
      failed = !ready;
      readyListeners.forEach((fn) => fn(ready));
      readyListeners.clear();
    }
  };
  return worker;
}

function restart() {
  worker?.terminate();
  worker = null;
  ready = false;
}

/** Start downloading TypeScript early, e.g. when a TypeScript editor appears. */
export function preloadTypeScript() {
  if (!failed) getWorker();
}

export function isTypeScriptReady() {
  return ready;
}

/**
 * Type-checks learner code. Resolves to null when the checker isn't available
 * (offline, CDN blocked, or too slow), so the caller can run the code anyway.
 */
export function typecheck(
  code: string,
  onLoading?: () => void,
): Promise<TypeDiagnostic[] | null> {
  if (failed) return Promise.resolve(null);
  const w = getWorker();
  if (!ready) onLoading?.();
  const id = nextId++;

  return new Promise((resolve) => {
    const done = (value: TypeDiagnostic[] | null) => {
      clearTimeout(timer);
      pending.delete(id);
      resolve(value);
    };
    const timer = setTimeout(
      () => {
        restart();
        done(null);
      },
      ready ? CHECK_TIMEOUT_MS : LOAD_TIMEOUT_MS,
    );
    if (!ready) readyListeners.add((ok) => ok || done(null));
    pending.set(id, (message) => {
      if (message.type === "result") done(message.diagnostics);
    });
    w.postMessage({ id, code } satisfies TypeCheckRequest);
  });
}
