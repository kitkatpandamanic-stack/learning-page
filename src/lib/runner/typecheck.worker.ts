import type * as TS from "typescript";

import {
  createTypeChecker,
  TS_LIB,
  TYPESCRIPT_VERSION,
  type TypeDiagnostic,
} from "./typecheck";

export type TypeCheckRequest = { id: number; code: string };

export type TypeCheckMessage =
  | { type: "ready" }
  | { type: "load-error"; message: string }
  | { type: "result"; id: number; diagnostics: TypeDiagnostic[] };

const CDN = `https://cdn.jsdelivr.net/npm/typescript@${TYPESCRIPT_VERSION}/lib/`;

// The project's TypeScript lib is "dom", so describe the worker scope we use.
const scope = self as unknown as {
  postMessage(message: TypeCheckMessage): void;
  onmessage: ((event: MessageEvent<TypeCheckRequest>) => void) | null;
};

async function download(file: string) {
  const response = await fetch(CDN + file);
  if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
  return response.text();
}

/** Fetches a lib file and every lib it references, e.g. es2023 → es2022 → … */
async function downloadLibs(libs: Map<string, string>, file: string) {
  if (libs.has(file)) return;
  libs.set(file, "");
  const text = await download(file);
  libs.set(file, text);
  const references = [
    ...text.matchAll(/^\/\/\/\s*<reference\s+lib="([^"]+)"/gm),
  ].map((m) => `lib.${m[1].toLowerCase()}.d.ts`);
  await Promise.all(references.map((ref) => downloadLibs(libs, ref)));
}

async function load() {
  const libs = new Map<string, string>();
  const [source] = await Promise.all([
    download("typescript.js"),
    downloadLibs(libs, TS_LIB),
  ]);
  // typescript.js is a classic script that declares a global `ts`.
  const ts = new Function(`${source}\nreturn ts;`)() as typeof TS;
  return createTypeChecker(ts, (file) => libs.get(file));
}

const checker = load().then(
  (check) => {
    scope.postMessage({ type: "ready" });
    return check;
  },
  (error: unknown) => {
    scope.postMessage({
      type: "load-error",
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  },
);

scope.onmessage = async (event) => {
  const check = await checker;
  if (!check) return;
  const { id, code } = event.data;
  scope.postMessage({ type: "result", id, diagnostics: check(code) });
};
