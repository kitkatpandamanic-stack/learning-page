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

  it("knows a worker's globals but not the DOM", () => {
    expect(
      check(
        'setTimeout(() => console.log("hi"), 10);\n' +
          'const res = await fetch("https://api.pandadev.test/movies");\n' +
          "console.log(res.ok, crypto.randomUUID(), new URL(res.url).host);",
      ),
    ).toEqual([]);
    expect(check("document.title;")[0].code).toBe(2584);
  });

  it("types the runner's libraries like their real packages", () => {
    expect(
      check(`import express, { type Request, type Response } from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { WebSocketServer } from "ws";

type Todo = { id: number; title: string };
const app = express();
app.use(express.json());
app.get("/todos/:id", (req, res) => {
  res.json({ id: Number(req.params.id) });
});
app.post("/todos", (req: Request<{}, Todo, { title: string }>, res: Response<Todo>) => {
  res.status(201).json({ id: 1, title: req.body.title });
});
const save = vi.fn((todo: Todo) => todo.id);
describe("todos", () => {
  it("finds one", async () => {
    const res = await request(app).get("/todos/1").expect(200);
    expect(res.body).toEqual({ id: 1 });
    expect(save).not.toHaveBeenCalled();
  });
});
new WebSocketServer({ port: 8080 }).on("connection", (socket) => {
  socket.on("message", (data) => socket.send(String(data)));
});`),
    ).toEqual([]);
    // Route parameters come from the path
    expect(
      check(`import express from "express";
express().get("/todos/:id", (req) => req.params.todoId);`)[0].message,
    ).toBe("Property 'todoId' does not exist on type '{ id: string; }'.");
  });

  it("gives pages the DOM, and React code React's own types", () => {
    expect(
      check(
        'const input = document.querySelector<HTMLInputElement>("#name");\n' +
          'input?.addEventListener("input", () => console.log(input.value));',
        "page",
      ),
    ).toEqual([]);
    expect(check('import express from "express";', "page")[0].code).toBe(2307);
    const component = `import { useState } from "react";
import { createRoot } from "react-dom/client";

function Counter({ step }: { step: number }) {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + step)}>{count}</button>;
}
createRoot(document.getElementById("root")!).render(<Counter step={STEP} />);`;
    expect(check(component.replace("STEP", "2"), "react")).toEqual([]);
    expect(check(component.replace("STEP", '"2"'), "react")[0].message).toBe(
      "Type 'string' is not assignable to type 'number'.",
    );
  });

  it("adds the compiler's hints, like a missing await", () => {
    const [error] = check(
      "async function load() { return { name: 'Mei' }; }\n" +
        "async function main() { console.log(load().name); }",
    );
    expect(error.message).toBe(
      "Property 'name' does not exist on type 'Promise<{ name: string; }>'.\n" +
        "  Did you forget to use 'await'?",
    );
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
