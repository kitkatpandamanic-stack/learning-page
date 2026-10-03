import { describe, expect, it } from "vitest";

import { execute } from "./execute";

const texts = (r: Awaited<ReturnType<typeof execute>>) =>
  r.output.map((l) => l.text);

describe("fetch and the practice API", () => {
  it("answers api.pandadev.test with JSON after a short delay", async () => {
    const r = await execute(`
      const res = await fetch("https://api.pandadev.test/movies/1");
      console.log(res.ok, res.status);
      const movie = await res.json();
      console.log(movie.title, movie.year);
    `);
    expect(r.error).toBeUndefined();
    expect(texts(r)).toEqual(["true 200", "The Bamboo Heist 2019"]);
  });

  it("waits for fetches that aren't awaited at the top level", async () => {
    const r = await execute(`
      fetch("https://api.pandadev.test/weather?city=tokyo")
        .then((res) => res.json())
        .then((data) => console.log(data.city, data.condition));
      console.log("first");
    `);
    expect(texts(r)).toEqual(["first", "Tokyo Rain"]);
  });

  it("reports errors with status codes and supports POST", async () => {
    const r = await execute(`
      const missing = await fetch("https://api.pandadev.test/movies/99");
      console.log(missing.status, (await missing.json()).error);
      const created = await fetch("https://api.pandadev.test/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Write tests" }),
      });
      console.log(created.status, await created.json());
      const gone = await fetch("https://api.pandadev.test/todos/1", { method: "DELETE" });
      console.log(gone.status);
      const list = await (await fetch("https://api.pandadev.test/todos")).json();
      console.log(list.map((t) => t.id));
    `);
    expect(r.error).toBeUndefined();
    expect(texts(r)).toEqual([
      "404 Movie not found",
      "201 { id: 4, title: 'Write tests', done: false }",
      "204",
      "[ 2, 3, 4 ]",
    ]);
  });

  it("starts every run with fresh data and logs requests for checks", async () => {
    await execute(
      `await fetch("https://api.pandadev.test/todos/2", { method: "DELETE" });`,
    );
    const r = await execute(
      `const todos = await (await fetch("https://api.pandadev.test/todos?x=1")).json();`,
      {
        tests: [
          { name: "fresh", check: "todos.length === 3" },
          {
            name: "logged",
            check:
              "__requests.length === 1 && __requests[0].url.endsWith('/todos?x=1')",
          },
        ],
      },
    );
    expect(r.tests?.map((t) => t.passed)).toEqual([true, true]);
  });

  it("fills in response.url, logs headers and can fail like a lost connection", async () => {
    const r = await execute(
      `
      const res = await fetch("https://api.pandadev.test/users/1", {
        headers: { Authorization: "Bearer abc" },
      });
      console.log(res.url);
      try {
        await fetch("https://api.pandadev.test/offline");
      } catch (error) {
        console.log(error.name, error.message);
      }
      await fetch("https://api.pandadev.test/todos/1", { method: "DELETE" });
    `,
      {
        tests: [
          {
            name: "headers",
            check: "__requests[0].headers.authorization === 'Bearer abc'",
          },
          { name: "no body", check: "__requests[2].body === undefined" },
        ],
      },
    );
    expect(texts(r)).toEqual([
      "https://api.pandadev.test/users/1",
      "TypeError Failed to fetch",
    ]);
    expect(r.tests?.map((t) => t.passed)).toEqual([true, true]);
  });

  it("can abort a slow request", async () => {
    const r = await execute(`
      try {
        await fetch("https://api.pandadev.test/delay/3000", { signal: AbortSignal.timeout(50) });
      } catch (error) {
        console.log(error.name);
      }
    `);
    expect(texts(r)).toEqual(["TimeoutError"]);
  });
});

describe("Vitest in the editor", () => {
  it("runs tests after the code and prints a report", async () => {
    const r = await execute(`
      import { describe, it, expect } from "vitest";
      function add(a, b) { return a + b; }
      describe("add", () => {
        it("adds numbers", () => {
          expect(add(2, 3)).toBe(5);
        });
        it("is wrong on purpose", () => {
          expect(add(2, 2)).toBe(5);
        });
      });
      it("compares objects deeply", () => {
        expect({ a: [1, { b: 2 }] }).toEqual({ a: [1, { b: 2 }] });
      });
    `);
    expect(r.error).toBeUndefined();
    expect(texts(r)).toEqual([
      "✓ add > adds numbers",
      "× add > is wrong on purpose",
      "  → expected 4 to be 5 // Object.is equality",
      "✓ compares objects deeply",
      "",
      "Tests  1 failed | 2 passed (3)",
    ]);
    expect(r.vitest).toMatchObject({ total: 3, passed: 2, failed: 1 });
  });

  it("supports mocks, async tests, hooks, each and asymmetric matchers", async () => {
    const r = await execute(`
      import { test, expect, vi, beforeEach } from "vitest";
      let calls = 0;
      beforeEach(() => { calls++; });
      test("mocks", () => {
        const send = vi.fn().mockReturnValue("sent");
        expect(send("hi")).toBe("sent");
        expect(send).toHaveBeenCalledWith("hi");
        expect(send).toHaveBeenCalledTimes(1);
      });
      test("async", async () => {
        const load = vi.fn().mockResolvedValue({ id: 1 });
        await expect(load()).resolves.toEqual({ id: expect.any(Number) });
        await expect(Promise.reject(new Error("nope"))).rejects.toThrow("nope");
      });
      test.each([[1, 1, 2], [2, 3, 5]])("adds %i + %i", (a, b, sum) => {
        expect(a + b).toBe(sum);
      });
      test("hooks ran", () => {
        expect(calls).toBe(5);
        expect(() => JSON.parse("{")).toThrow(SyntaxError);
        expect([1, 2, 3]).toContain(2);
        expect("panda").toMatch(/and/);
        expect({ a: 1, b: 2 }).toMatchObject({ a: 1 });
      });
    `);
    expect(r.error).toBeUndefined();
    expect(texts(r).at(-1)).toBe("Tests  5 passed (5)");
  });

  it("has fake timers", async () => {
    const r = await execute(`
      import { test, expect, vi } from "vitest";
      function debounce(fn, ms) {
        let id;
        return (...args) => { clearTimeout(id); id = setTimeout(() => fn(...args), ms); };
      }
      test("debounce", () => {
        vi.useFakeTimers();
        const fn = vi.fn();
        const run = debounce(fn, 100);
        run(1); run(2);
        vi.advanceTimersByTime(99);
        expect(fn).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(fn).toHaveBeenCalledWith(2);
      });
    `);
    expect(texts(r)).toEqual(["✓ debounce", "", "Tests  1 passed (1)"]);
  });

  it("fails a test whose rejects assertion wasn't awaited", async () => {
    const r = await execute(`
      import { test, expect } from "vitest";
      test("forgot await", () => {
        expect(Promise.resolve(1)).rejects.toThrow();
      });
    `);
    expect(r.error).toBeUndefined();
    expect(texts(r)).toEqual([
      "× forgot await",
      '  → promise resolved "1" instead of rejecting',
      "",
      "Tests  1 failed (1)",
    ]);
  });

  it("lets checks rerun the tests against buggy code", async () => {
    const code = `
      import { test, expect } from "vitest";
      function isAdult(age) { return age >= 18; }
      test("18 is an adult", () => expect(isAdult(18)).toBe(true));
    `;
    const r = await execute(code, {
      tests: [
        { name: "passes", check: "__vitest.passed === 1" },
        {
          name: "catches >",
          check: "(await __retest([['age >= 18', 'age > 18']])).failed === 1",
        },
      ],
    });
    expect(r.tests?.map((t) => t.passed)).toEqual([true, true]);
  });
});

describe("Express in the editor", () => {
  it("routes requests and is tested with supertest's request()", async () => {
    const r = await execute(`
      import express from "express";
      import request from "supertest";
      const app = express();
      app.use(express.json());
      const notes = [{ id: 1, text: "Hi" }];
      app.get("/notes", (req, res) => res.json(notes));
      app.get("/notes/:id", (req, res) => {
        const note = notes.find((n) => n.id === Number(req.params.id));
        if (!note) return res.status(404).json({ error: "Note not found" });
        res.json(note);
      });
      app.post("/notes", (req, res) => {
        const note = { id: notes.length + 1, text: req.body.text };
        notes.push(note);
        res.status(201).json(note);
      });
      const list = await request(app).get("/notes");
      console.log(list.status, list.body);
      console.log((await request(app).get("/notes/9")).status);
      const made = await request(app).post("/notes").send({ text: "Yo" });
      console.log(made.status, made.body);
      console.log((await request(app).get("/nope")).text);
    `);
    expect(r.error).toBeUndefined();
    expect(texts(r)).toEqual([
      "200 [ { id: 1, text: 'Hi' } ]",
      "404",
      "201 { id: 2, text: 'Yo' }",
      "Cannot GET /nope",
    ]);
  });

  it("supports middleware, routers, async errors and error handlers", async () => {
    const r = await execute(`
      import express from "express";
      import request from "supertest";
      const app = express();
      const log = [];
      app.use((req, res, next) => { log.push(req.method + " " + req.path); next(); });
      const api = express.Router();
      api.get("/items/:id", async (req, res) => {
        if (req.params.id === "0") throw new Error("boom");
        res.json({ id: req.params.id, q: req.query.q });
      });
      app.use("/api", api);
      app.use((err, req, res, next) => res.status(500).json({ error: err.message }));
      console.log((await request(app).get("/api/items/7?q=x")).body);
      const failed = await request(app).get("/api/items/0");
      console.log(failed.status, failed.body);
      console.log(log);
      await request(app).get("/api/items/7").expect(200).expect("Content-Type", /json/);
      console.log("expectations passed");
    `);
    expect(r.error).toBeUndefined();
    expect(texts(r)).toEqual([
      "{ id: '7', q: 'x' }",
      "500 { error: 'boom' }",
      "[ 'GET /api/items/7', 'GET /api/items/0' ]",
      "expectations passed",
    ]);
  });

  it("leaves req.body undefined without express.json(), like Express 5", async () => {
    const r = await execute(`
      import express from "express";
      import request from "supertest";
      const app = express();
      app.post("/", (req, res) => res.json({ body: req.body ?? "missing" }));
      console.log((await request(app).post("/").send({ a: 1 })).body);
    `);
    expect(texts(r)).toEqual(["{ body: 'missing' }"]);
  });

  it("explains which modules are available", async () => {
    const r = await execute(`import _ from "lodash";`);
    expect(r.error?.message).toMatch(/Cannot find module 'lodash'/);
  });
});
