import ts from "typescript";
import { describe, expect, it } from "vitest";

import { checkTypes as check } from "../../../tests/node-typecheck";
import { typeErrorResult, TYPESCRIPT_VERSION } from "./typecheck";

describe("createTypeChecker", () => {
  it("matches the TypeScript version loaded in the browser", () => {
    expect(ts.version).toBe(TYPESCRIPT_VERSION);
  });

  it("accepts correct code", () => {
    expect(
      check('const n: number = 1;\nconsole.log([n].at(-1), "a".padStart(3));'),
    ).toEqual([]);
  });

  it("reports type errors with line, column and message", () => {
    const [error, ...rest] = check('let age = 3;\nage = "three";');
    expect(rest).toEqual([]);
    expect(error).toMatchObject({
      line: 2,
      column: 1,
      code: 2322,
      message: "Type 'string' is not assignable to type 'number'.",
    });
  });

  it("is strict: no implicit any and null checks", () => {
    const codes = check(
      "function f(x) { return x; }\nconst s: string | null = null;\ns.length;",
    ).map((d) => d.code);
    expect(codes).toEqual([7006, 18047]);
  });

  it("knows the runner's globals but not the DOM", () => {
    expect(check("setTimeout(() => console.log('hi'), 10);")).toEqual([]);
    expect(check("document.title;")[0].code).toBe(2584);
  });

  it("only reports syntax errors when the code doesn't parse", () => {
    const diagnostics = check("const x: number = ;\nconst y: string = 1;");
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].line).toBe(1);
  });

  it("gives each run a fresh file", () => {
    expect(check("const total = 1;")).toEqual([]);
    expect(check("const total = 2;")).toEqual([]);
  });

  it("turns diagnostics into a failed result", () => {
    const result = typeErrorResult(check('const n: number = "1";'), [
      { name: "t", check: "true" },
    ]);
    expect(result.output.map((l) => l.text)).toEqual([
      "Line 1: Type 'string' is not assignable to type 'number'.",
      "1 type error. Fix it to run your code.",
    ]);
    expect(result.tests?.[0]).toMatchObject({ passed: false });
  });
});
