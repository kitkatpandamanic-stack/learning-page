import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

import { createTypeChecker, type TypeEnv } from "@/lib/runner/typecheck";
import { reactTypePackages } from "../scripts/vendor-name.mjs";

const libDir = join(__dirname, "..", "node_modules", "typescript", "lib");

/** Library and React type files, read from node_modules. */
function readLib(file: string) {
  const [, pkg, rest] = /^types\/([^/]+)\/(.+)$/.exec(file) ?? [];
  const path = pkg
    ? join(reactTypePackages[pkg as keyof typeof reactTypePackages], rest)
    : join(libDir, file);
  try {
    return readFileSync(path, "utf8");
  } catch {
    return undefined;
  }
}

const checkers = new Map<TypeEnv, ReturnType<typeof createTypeChecker>>();

/** The browser's type checker for code that runs in `env`. */
export function checkTypes(code: string, env: TypeEnv = "worker") {
  let check = checkers.get(env);
  if (!check) {
    check = createTypeChecker(ts, readLib, env);
    checkers.set(env, check);
  }
  return check(code);
}
