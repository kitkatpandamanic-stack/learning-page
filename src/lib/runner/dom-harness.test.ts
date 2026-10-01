import { describe, expect, it } from "vitest";

import { openPreview, runDomInNode } from "../../../tests/node-dom";
import { formatArgs } from "./format";
import { addLoopGuards } from "./loop-guard";

const html = `<button id="add">Add</button><p id="count">0</p>`;

describe("addLoopGuards", () => {
  it("guards every kind of loop without changing line numbers", () => {
    const code = [
      "for (let i = 0; i < 3; i++) {",
      "  while (false) x();",
      "}",
      "do { y(); } while (false);",
      "for (const k in {}) for (const v of []) z();",
    ].join("\n");
    const guarded = addLoopGuards(code);
    expect(guarded.split("\n")).toHaveLength(5);
    expect(guarded.match(/__pandaLoop\(\)/g)).toHaveLength(5);
    expect(guarded).toContain("while (false) {__pandaLoop();x();}");
  });

  it("leaves code that doesn't parse alone", () => {
    expect(addLoopGuards("for (;;) {")).toBe("for (;;) {");
  });
});

describe("preview harness", () => {
  it("formats console output exactly like the worker runner", () => {
    const expressions = [
      '"plain"',
      "42",
      "-0",
      "null",
      "undefined",
      "true",
      "10n",
      '[1, "a", [2, [3, [4]]]]',
      '({ a: 1, "b c": "x", deep: { d: { e: { f: 1 } } } })',
      'new Map([["a", 1]])',
      "new Set([1, 2])",
      "new (class Point { constructor() { this.x = 1; } })()",
      "new (class Empty {})()",
      'new Error("boom")',
      "[]",
      "({})",
      "function foo() {}",
      "(() => 1)",
      "new Date(0)",
      "/ab+c/g",
      '"it\'s\\nnew"',
      '["it\'s"]',
    ];
    const window = openPreview("").window as unknown as {
      eval(code: string): unknown;
    };
    for (const expression of expressions) {
      const inPage = window.eval(`__pandaFormat([${expression}])`);
      const inWorker = formatArgs([(0, eval)(`(${expression})`)]);
      expect(inPage, expression).toBe(inWorker);
    }
  });

  it("formats elements and node lists", async () => {
    const r = await runDomInNode(
      'console.log(document.querySelector("#add"), document.querySelectorAll("p"));',
      html,
    );
    expect(r.output.map((l) => l.text)).toEqual([
      '<button id="add"> NodeList(1) [ <p id="count"> ]',
    ]);
  });

  it("runs code against the page and checks the result", async () => {
    const code = `
      const button = document.querySelector("#add");
      const count = document.querySelector("#count");
      button.addEventListener("click", () => {
        count.textContent = String(Number(count.textContent) + 1);
      });
      console.log("ready");`;
    const r = await runDomInNode(code, html, [
      { name: "starts at 0", check: 'count.textContent === "0"' },
      {
        name: "click adds one",
        check:
          '(document.querySelector("#add").click(), document.querySelector("#count").textContent === "1")',
      },
      { name: "wrong", check: "count.textContent === '5'" },
      { name: "throws", check: "missing.value" },
    ]);
    expect(r.error).toBeUndefined();
    expect(r.output.map((l) => l.text)).toEqual(["ready"]);
    expect(r.tests?.map((t) => t.passed)).toEqual([true, true, false, false]);
    expect(r.tests?.[3].error).toMatch(/ReferenceError/);
  });

  it("reports errors and fails the checks", async () => {
    const r = await runDomInNode(
      'const el = document.querySelector("#nope");\nel.textContent = "x";',
      html,
      [{ name: "t", check: "true" }],
    );
    expect(r.error).toMatchObject({ name: "TypeError", line: 2 });
    expect(r.output[0].text).toMatch(/^TypeError: /);
    expect(r.tests?.[0]).toMatchObject({ passed: false });
  });

  it("stops infinite loops", async () => {
    const r = await runDomInNode("let n = 0;\nwhile (true) { n++; }", html);
    expect(r.error).toMatchObject({ name: "RangeError", line: 2 });
    expect(r.error?.message).toMatch(/infinite loop/);
  }, 10_000);

  it("runs in strict mode", async () => {
    const r = await runDomInNode(
      "console.log((function () { return this; })());",
      html,
    );
    expect(r.output[0].text).toBe("undefined");
  });

  it("gives the page a localStorage that survives the next run", async () => {
    const storage: Record<string, string> = {};
    const code = `
      const saved = JSON.parse(localStorage.getItem("tasks") ?? "[]");
      console.log(saved.length, localStorage.length);
      saved.push("task " + (saved.length + 1));
      localStorage.setItem("tasks", JSON.stringify(saved));`;
    const first = await runDomInNode(code, html, [], storage);
    expect(first.output.map((l) => l.text)).toEqual(["0 0"]);
    expect(JSON.parse(storage.tasks)).toEqual(["task 1"]);

    const second = await runDomInNode(code, html, [], storage);
    expect(second.output.map((l) => l.text)).toEqual(["1 1"]);
    expect(JSON.parse(storage.tasks)).toEqual(["task 1", "task 2"]);

    await runDomInNode("localStorage.clear();", html, [], storage);
    expect(storage).toEqual({});
  });
});
