import type * as TS from "typescript";

import {
  createTypeChecker,
  ENV_LIBS,
  REACT_TYPE_FILES,
  TYPESCRIPT_VERSION,
  type TypeDiagnostic,
  type TypeEnv,
} from "./typecheck";

export type TypeCheckRequest = { id: number; code: string; env: TypeEnv };

export type TypeCheckMessage =
  | { type: "load-error"; id: number; message: string }
  | { type: "result"; id: number; diagnostics: TypeDiagnostic[] };

// Served by this site (scripts/build-vendor.mjs copies them from node_modules).
const BASE = `/vendor/typescript-${TYPESCRIPT_VERSION}/`;
const REACT_TYPES = `${process.env.NEXT_PUBLIC_REACT_TYPES}/`;

// The project's TypeScript lib is "dom", so describe the worker scope we use.
const scope = self as unknown as {
  postMessage(message: TypeCheckMessage): void;
  onmessage: ((event: MessageEvent<TypeCheckRequest>) => void) | null;
};

async function download(file: string, base = BASE) {
  const response = await fetch(base + file);
  if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
  return response.text();
}

// Library files by name, shared by every environment's checker.
const libs = new Map<string, string>();
const downloads = new Map<string, Promise<void>>();

/** Fetches a lib file and every lib it references, e.g. es2023 → es2022 → … */
function downloadLib(file: string): Promise<void> {
  let pending = downloads.get(file);
  if (!pending) {
    pending = download(file).then((text) => {
      libs.set(file, text);
      const references = [
        ...text.matchAll(/^\/\/\/\s*<reference\s+lib="([^"]+)"/gm),
      ].map((m) => `lib.${m[1].toLowerCase()}.d.ts`);
      return Promise.all(references.map(downloadLib)).then(() => {});
    });
    // A failed download is tried again next time.
    pending.catch(() => downloads.delete(file));
    downloads.set(file, pending);
  }
  return pending;
}

const compiler = download("typescript.js").then(
  // typescript.js is a classic script that declares a global `ts`.
  (source) => new Function(`${source}\nreturn ts;`)() as typeof TS,
);

/** Each environment's checker loads its libraries on first use. */
const checkers = new Map<
  TypeEnv,
  Promise<(code: string) => TypeDiagnostic[]>
>();

function checkerFor(env: TypeEnv) {
  let checker = checkers.get(env);
  if (!checker) {
    checker = (async () => {
      const [ts] = await Promise.all([
        compiler,
        ...ENV_LIBS[env].map(downloadLib),
        ...(env === "react"
          ? REACT_TYPE_FILES.map(async (file) => {
              libs.set(`types/${file}`, await download(file, REACT_TYPES));
            })
          : []),
      ]);
      return createTypeChecker(ts, (file) => libs.get(file), env);
    })();
    checker.catch(() => checkers.delete(env));
    checkers.set(env, checker);
  }
  return checker;
}

scope.onmessage = async (event) => {
  const { id, code, env } = event.data;
  try {
    const check = await checkerFor(env);
    scope.postMessage({ type: "result", id, diagnostics: check(code) });
  } catch (error) {
    scope.postMessage({
      type: "load-error",
      id,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
