import { inspect } from "node:util";
import { describe, expect, it } from "vitest";

import { compareOutput, execute } from "./execute";
import { formatArgs } from "./format";

const texts = (r: Awaited<ReturnType<typeof execute>>) =>
  r.output.map((l) => l.text);

describe("formatArgs", () => {
  it.each([
    [["hello"]],
    [[42, "and", true]],
    [[[1, "two", [3, [4, [5]]]]]],
    [[{ name: "Panda", age: 5, tags: ["a", "b"] }]],
    [[{}, []]],
    [[null, undefined, -0, BigInt(10)]],
    [[{ "my-key": 1, ok: { deep: { deeper: { deepest: 1 } } } }]],
  ])("matches Node's console.log (case %#)", (args) => {
    const node = args
      .map((a) => (typeof a === "string" ? a : inspect(a, { depth: 2 })))
      .join(" ");
    expect(formatArgs(args)).toBe(node);
  });

  it("formats functions, maps and sets like Node", () => {
    function greet() {}
    expect(formatArgs([greet])).toBe("[Function: greet]");
    expect(formatArgs([new Map([["a", 1]])])).toBe("Map(1) { 'a' => 1 }");
    expect(formatArgs([new Set([1, 2])])).toBe("Set(2) { 1, 2 }");
  });

  it("handles circular references", () => {
    const a: Record<string, unknown> = { name: "loop" };
    a.self = a;
    expect(formatArgs([a])).toBe("{ name: 'loop', self: [Circular] }");
  });
});

describe("execute", () => {
  it("captures console output in order", async () => {
    const r = await execute('console.log("a"); console.log(1 + 2);');
    expect(texts(r)).toEqual(["a", "3"]);
    expect(r.error).toBeUndefined();
  });

  it("reports runtime errors with the learner's line number", async () => {
    const r = await execute('console.log("ok");\nconst x = 1;\nx = 2;');
    expect(r.error).toMatchObject({ name: "TypeError", line: 3 });
    expect(texts(r)).toEqual([
      "ok",
      "TypeError: Assignment to constant variable.",
    ]);
  });

  it("uses strict mode, so undeclared variables are errors", async () => {
    const r = await execute("total = 5;");
    expect(r.error?.name).toBe("ReferenceError");
  });

  it("reports syntax errors", async () => {
    const r = await execute("console.log('missing bracket'");
    expect(r.error?.name).toBe("SyntaxError");
  });

  it("waits for timers and supports top-level await", async () => {
    const r = await execute(`
      setTimeout(() => console.log("later"), 20);
      await new Promise((r) => setTimeout(r, 5));
      console.log("first");
    `);
    expect(texts(r)).toEqual(["first", "later"]);
  });

  it("runs tests in the learner's scope", async () => {
    const r = await execute("function add(a, b) { return a + b; }", {
      tests: [
        { name: "adds", check: "add(2, 3) === 5" },
        { name: "wrong on purpose", check: "add(2, 2) === 5" },
        { name: "throws", check: "missing()" },
      ],
    });
    expect(r.tests?.map((t) => t.passed)).toEqual([true, false, false]);
    expect(r.tests?.[2].error).toMatch(/ReferenceError/);
  });

  it("lets tests inspect printed output", async () => {
    const r = await execute('console.log("Done!")', {
      tests: [{ name: "prints Done!", check: '__output.at(-1) === "Done!"' }],
    });
    expect(r.tests?.[0].passed).toBe(true);
  });

  it("fails every test when the code throws", async () => {
    const r = await execute("throw new Error('boom')", {
      tests: [{ name: "anything", check: "true" }],
    });
    expect(r.tests?.[0]).toMatchObject({ passed: false });
  });

  it("runs TypeScript by stripping the types", async () => {
    const r = await execute(
      "const greet = (name: string): string => `Hi, ${name}`;\nconsole.log(greet('TS'));",
      { language: "typescript" },
    );
    expect(texts(r)).toEqual(["Hi, TS"]);
  });

  it("keeps TypeScript line numbers for errors", async () => {
    const r = await execute("type N = number;\nconst n: N = 1;\nn = 2;", {
      language: "typescript",
    });
    expect(r.error?.line).toBe(3);
  });

  it("stops recording runaway output", async () => {
    const r = await execute("for (let i = 0; i < 1000; i++) console.log(i);");
    expect(r.output.at(-1)?.text).toMatch(/Output stopped/);
  });
});

describe("compareOutput", () => {
  const out = (...lines: string[]) =>
    lines.map((text) => ({ level: "log" as const, text }));

  it("passes on an exact match, ignoring trailing whitespace", () => {
    expect(compareOutput(out("a ", "b"), "a\nb\n").passed).toBe(true);
  });

  it("points at the first differing line", () => {
    expect(compareOutput(out("a", "x"), "a\nb")).toMatchObject({
      passed: false,
      line: 2,
      expected: "b",
      got: "x",
    });
  });

  it("fails when lines are missing", () => {
    expect(compareOutput(out("a"), "a\nb")).toMatchObject({
      passed: false,
      line: 2,
      expected: "b",
    });
  });
});
