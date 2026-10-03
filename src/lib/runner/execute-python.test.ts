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

// These install real packages (pytest, FastAPI, pandas…), like lessons do.
describe("error hints", () => {
  it("adds Python's suggestions to error messages", async () => {
    const message = async (code: string) =>
      (await executePython(py, code)).error?.message;
    expect(await message("score = 3\nprint(scor)")).toBe(
      "name 'scor' is not defined. Did you mean: 'score'?",
    );
    expect(await message("print(math.pi)")).toBe(
      "name 'math' is not defined. Did you forget to import 'math'?",
    );
    expect(await message("[].apend(1)")).toBe(
      "'list' object has no attribute 'apend'. Did you mean: 'append'?",
    );
  });
});

describe("executePython with packages", () => {
  it("has time zones for zoneinfo", async () => {
    const r = await executePython(
      py,
      [
        "from datetime import datetime",
        "from zoneinfo import ZoneInfo",
        'meet = datetime(2026, 3, 14, 9, 30, tzinfo=ZoneInfo("Europe/London"))',
        'print(meet.astimezone(ZoneInfo("Asia/Tokyo")).strftime("%H:%M"))',
      ].join("\n"),
    );
    expect(r.error).toBeUndefined();
    expect(r.output.map((l) => l.text)).toEqual(["18:30"]);
  });

  it("runs asyncio.run without threads", async () => {
    const r = await executePython(
      py,
      [
        "import asyncio, time",
        "async def work(n, delay):",
        "    await asyncio.sleep(delay)",
        "    return n",
        "async def main():",
        "    start = time.perf_counter()",
        "    print(await asyncio.gather(work(1, 0.2), work(2, 0.1)))",
        "    print(round(time.perf_counter() - start, 1))",
        "    try:",
        "        await asyncio.wait_for(asyncio.sleep(1), 0.05)",
        "    except TimeoutError:",
        '        print("timed out")',
        "    print(await asyncio.to_thread(sum, [1, 2, 3]))",
        "asyncio.run(main())",
      ].join("\n"),
    );
    expect(r.error).toBeUndefined();
    expect(texts(r)).toEqual(["[1, 2]", "0.2", "timed out", "6"]);
  });

  it("runs FastAPI apps with TestClient", async () => {
    const r = await executePython(
      py,
      [
        "from contextlib import asynccontextmanager",
        "from fastapi import FastAPI, HTTPException",
        "from fastapi.testclient import TestClient",
        "from pydantic import BaseModel",
        "@asynccontextmanager",
        "async def lifespan(app):",
        '    print("startup")',
        "    yield",
        '    print("shutdown")',
        "app = FastAPI(lifespan=lifespan)",
        "class Todo(BaseModel):",
        "    title: str",
        "    done: bool = False",
        "todos = []",
        '@app.post("/todos", status_code=201)',
        "def add(todo: Todo):",
        "    todos.append(todo)",
        "    return todo",
        '@app.get("/todos/{i}")',
        "async def get(i: int):",
        "    if i >= len(todos):",
        '        raise HTTPException(404, "Not found")',
        "    return todos[i]",
        "client = TestClient(app)",
        'r = client.post("/todos", json={"title": "Learn"})',
        "print(r.status_code, r.json())",
        'print(client.get("/todos/0").json())',
        'print(client.get("/todos/5").status_code)',
        'print(client.post("/todos", json={}).status_code)',
        "with TestClient(app) as c:",
        '    print(c.get("/todos/0").status_code)',
      ].join("\n"),
    );
    expect(r.error).toBeUndefined();
    expect(texts(r)).toEqual([
      "201 {'title': 'Learn', 'done': False}",
      "{'title': 'Learn', 'done': False}",
      "404",
      "422",
      "startup",
      "200",
      "shutdown",
    ]);
  }, 60_000);

  it("runs pytest on the learner's code", async () => {
    const code = [
      "import pytest",
      "def add(a, b):",
      "    return a + b",
      "def test_add():",
      "    assert add(2, 3) == 5",
      '@pytest.mark.parametrize("a, b, total", [(1, 1, 2), (2, 2, 4)])',
      "def test_more(a, b, total):",
      "    assert add(a, b) == total",
      "pytest.main([__file__])",
    ].join("\n");
    const r = await executePython(py, code, {
      tests: [
        { name: "passes", check: '_panda_pytest()["passed"] == 3' },
        {
          name: "catches a bug",
          check:
            '_panda_pytest(patch={"add": lambda a, b: a - b})["failed"] == 3',
        },
      ],
    });
    expect(r.error).toBeUndefined();
    const out = texts(r).join("\n");
    expect(out).toMatch(/^\.\.\. +\[100%\]\n3 passed in [\d.]+s$/);
    expect(r.tests?.map((t) => t.passed)).toEqual([true, true]);

    // A later run sees the new code, not the old module.
    const again = await executePython(py, code.replace("a + b", "a * b"));
    expect(texts(again).join("\n")).toMatch(/2 failed, 1 passed/);
  }, 60_000);

  it("prints pandas tables and runs SQLAlchemy", async () => {
    const r = await executePython(
      py,
      [
        "import pandas as pd",
        'df = pd.DataFrame({"city": ["A", "B", "A"], "sales": [1, 2, 3]})',
        'print(df.groupby("city")["sales"].sum().to_dict())',
        "from sqlalchemy import create_engine, text",
        'engine = create_engine("sqlite://")',
        "with engine.connect() as conn:",
        '    print(conn.execute(text("select 1 + 1")).scalar())',
      ].join("\n"),
    );
    expect(r.error).toBeUndefined();
    expect(texts(r)).toEqual(["{'A': 4, 'B': 2}", "2"]);
  }, 60_000);

  it("shows matplotlib charts as images", async () => {
    const r = await executePython(
      py,
      [
        "import matplotlib.pyplot as plt",
        "plt.plot([1, 2, 3], [3, 1, 2])",
        "plt.show()",
        'print("done")',
      ].join("\n"),
    );
    expect(r.error).toBeUndefined();
    expect(r.output[0].image).toMatch(/^data:image\/png;base64,/);
    expect(r.output[1].text).toBe("done");
  }, 60_000);

  it("starts every run with fresh logging", async () => {
    const setup = [
      "import logging, sys",
      'logging.basicConfig(level=logging.INFO, format="%(message)s", stream=sys.stdout)',
      'logging.info("first")',
    ].join("\n");
    expect(texts(await executePython(py, setup))).toEqual(["first"]);
    const again = await executePython(py, setup.replace("first", "second"));
    expect(texts(again)).toEqual(["second"]);
  });
});
