import type * as PgliteModule from "@electric-sql/pglite";

import type { ExecuteResult, OutputLine, TestSpec } from "./execute";
import { createSqlSandbox, executeSql } from "./execute-sql";
import { SQL_SEED } from "./sql-seed";

export type SqlRequest = { id: number; code: string; tests: TestSpec[] };

export type SqlMessage =
  | { type: "ready" }
  | { type: "load-error"; message: string }
  | { type: "started"; id: number }
  | { type: "line"; id: number; line: OutputLine }
  | { type: "done"; id: number; result: ExecuteResult };

// The project's TypeScript lib is "dom", so describe the worker scope we use.
const scope = self as unknown as {
  postMessage(message: SqlMessage): void;
  onmessage: ((event: MessageEvent<SqlRequest>) => void) | null;
};

// Served by this site (scripts/build-vendor.mjs copies it from node_modules),
// with its .wasm and .data files next to it.
const PGLITE_URL = process.env.NEXT_PUBLIC_PGLITE!;

// PostgreSQL starts once per worker (about a second) with the sample
// database; every run then opens a fresh copy of it.
const sandbox = (
  import(
    /* webpackIgnore: true */ /* turbopackIgnore: true */ PGLITE_URL
  ) as Promise<typeof PgliteModule>
).then(({ PGlite }) =>
  createSqlSandbox((options) => PGlite.create(options), SQL_SEED),
);

sandbox.then(
  () => scope.postMessage({ type: "ready" }),
  (error: unknown) =>
    scope.postMessage({
      type: "load-error",
      message: error instanceof Error ? error.message : String(error),
    }),
);

scope.onmessage = async (event) => {
  const { id, code, tests } = event.data;
  const open = await sandbox;
  const db = await open();
  scope.postMessage({ type: "started", id });
  try {
    const result = await executeSql(db, code, {
      tests,
      onLine: (line) => scope.postMessage({ type: "line", id, line }),
    });
    scope.postMessage({ type: "done", id, result });
  } finally {
    await db.close();
  }
};
