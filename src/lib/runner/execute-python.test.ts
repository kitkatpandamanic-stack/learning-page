import { loadPyodide, type PyodideInterface } from "pyodide";
import { beforeAll, describe, expect, it } from "vitest";

import { executePython } from "./execute-python";

let py: PyodideInterface;
beforeAll(async () => {
  py = await loadPyodide();
}, 60_000);

const texts = (r: Awaited<ReturnType<typeof executePython>>) =>
  r.output.map((l) => l.text);

describe("executePython", () => {
  it("captures print output line by line", async () => {
    const r = await executePython(
      py,
      'print("a")\nprint("b\\nc")\nprint(1 + 2)',
    );
    expect(texts(r)).toEqual(["a", "b", "c", "3"]);
    expect(r.error).toBeUndefined();
  });

  it("supports print arguments like end and sep", async () => {
    const r = await executePython(
      py,
      'print("a", "b", sep="-", end="")\nprint("!")',
    );
    expect(texts(r)).toEqual(["a-b!"]);
  });

  it("reports runtime errors with the learner's line number", async () => {
    const r = await executePython(py, 'print("ok")\nx = 1\nprint(y)');
    expect(r.error).toMatchObject({
      name: "NameError",
      line: 3,
      message: "name 'y' is not defined",
    });
    expect(texts(r)).toEqual(["ok", "NameError: name 'y' is not defined"]);
  });

  it("reports syntax errors with a line number", async () => {
    const r = await executePython(py, "x = 1\nif x > 0\n    print(x)");
    expect(r.error).toMatchObject({ name: "SyntaxError", line: 2 });
  });

  it("starts every run with a fresh namespace", async () => {
    await executePython(py, "leftover = 1");
    const r = await executePython(py, "print(leftover)");
    expect(r.error?.name).toBe("NameError");
  });

  it("runs tests in the learner's namespace", async () => {
    const r = await executePython(py, "def add(a, b):\n    return a + b", {
      tests: [
        { name: "adds", check: "add(2, 3) == 5" },
        { name: "wrong", check: "add(2, 2) == 5" },
        { name: "throws", check: "missing()" },
      ],
    });
    expect(r.tests?.map((t) => t.passed)).toEqual([true, false, false]);
    expect(r.tests?.[2].error).toMatch(/NameError/);
  });

  it("lets tests read printed output", async () => {
    const r = await executePython(py, 'print("Done!")', {
      tests: [{ name: "prints Done!", check: '__output[-1] == "Done!"' }],
    });
    expect(r.tests?.[0].passed).toBe(true);
  });

  it("explains that input() isn't available", async () => {
    const r = await executePython(py, 'name = input("Name? ")');
    expect(r.error?.message).toMatch(/input\(\) isn't supported/);
  });

  it("restores print after an error", async () => {
    await executePython(py, "raise ValueError('boom')");
    const r = await executePython(py, 'print("still works")');
    expect(texts(r)).toEqual(["still works"]);
  });

  it("stops recording runaway output", async () => {
    const r = await executePython(py, "for i in range(1000):\n    print(i)");
    expect(r.output.at(-1)?.text).toMatch(/Output stopped/);
  });
});
