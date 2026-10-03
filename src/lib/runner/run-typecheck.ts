import type { TypeDiagnostic, TypeEnv } from "./typecheck";
import type { TypeCheckMessage, TypeCheckRequest } from "./typecheck.worker";

const LOAD_TIMEOUT_MS = 60_000;
const CHECK_TIMEOUT_MS = 10_000;

/**
 * One long-lived type-checking worker for the whole page: TypeScript is a
 * large download, so it's fetched once, on the first TypeScript run. Each
 * environment (worker, page, React) loads its own type libraries on first use.
 */
let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, (message: TypeCheckMessage) => void>();
/** Environments whose libraries have loaded. */
const readyEnvs = new Set<TypeEnv>();
/** Ends every check still waiting on the current worker (used on restart). */
const abortChecks = new Set<() => void>();

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL("./typecheck.worker.ts", import.meta.url), {
    type: "module",
  });
  worker.onmessage = (event: MessageEvent<TypeCheckMessage>) => {
    pending.get(event.data.id)?.(event.data);
  };
  return worker;
}

function restart() {
  worker?.terminate();
  worker = null;
  readyEnvs.clear();
  // Their worker is gone; without this, their own timers would later kill
  // the next worker too.
  for (const abort of [...abortChecks]) abort();
}

/** Start downloading TypeScript early, e.g. when a TypeScript editor appears. */
export function preloadTypeScript(env: TypeEnv = "worker") {
  if (!readyEnvs.has(env)) void typecheck("", { env });
}

export function isTypeScriptReady(env: TypeEnv = "worker") {
  return readyEnvs.has(env);
}

/**
 * Type-checks learner code. Resolves to null when the checker isn't available
 * (offline, or too slow), so the caller can run the code anyway.
 */
export function typecheck(
  code: string,
  options: { env?: TypeEnv; onLoading?: () => void } = {},
): Promise<TypeDiagnostic[] | null> {
  const { env = "worker", onLoading } = options;
  const w = getWorker();
  const ready = readyEnvs.has(env);
  if (!ready) onLoading?.();
  const id = nextId++;

  return new Promise((resolve) => {
    const done = (value: TypeDiagnostic[] | null) => {
      clearTimeout(timer);
      pending.delete(id);
      abortChecks.delete(abort);
      resolve(value);
    };
    const abort = () => done(null);
    abortChecks.add(abort);
    const timer = setTimeout(
      () => {
        restart();
        done(null);
      },
      ready ? CHECK_TIMEOUT_MS : LOAD_TIMEOUT_MS,
    );
    pending.set(id, (message) => {
      if (message.type === "result") {
        readyEnvs.add(env);
        done(message.diagnostics);
      } else {
        done(null);
      }
    });
    w.postMessage({ id, code, env } satisfies TypeCheckRequest);
  });
}
