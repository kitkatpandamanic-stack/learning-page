import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

import { createTypeChecker } from "@/lib/runner/typecheck";

const libDir = join(__dirname, "..", "node_modules", "typescript", "lib");

/** The browser's type checker, with lib files read from node_modules. */
export const checkTypes = createTypeChecker(ts, (file) => {
  try {
    return readFileSync(join(libDir, file), "utf8");
  } catch {
    return undefined;
  }
});
