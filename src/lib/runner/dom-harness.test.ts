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
      "(function* () { yield 1; })()",
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

  it("fills %s-style placeholders like the worker runner", () => {
    const argLists = [
      '"%s is %d years", "Mei", 3',
      '"%s and %s", "one"',
      '"%i%% done", 42.9',
      '"%o", { a: [1, "x"] }',
      '"%s", { a: 1 }',
      '"%c styled", "color: red"',
      '"%j", { a: 1 }',
      '"%d", {}',
      '"no placeholders", 1, "two"',
      '"%s!", "hi", "extra", 3',
    ];
    const window = openPreview("").window as unknown as {
      eval(code: string): unknown;
    };
    for (const args of argLists) {
      const inPage = window.eval(`__pandaFormat([${args}])`);
      const inWorker = formatArgs((0, eval)(`[${args}]`));
      expect(inPage, args).toBe(inWorker);
    }
    expect(formatArgs(["%s is %d years", "Mei", 3])).toBe("Mei is 3 years");
    expect(formatArgs(["%s!", "hi", "extra", 3])).toBe("hi! extra 3");
    expect(formatArgs(["%s and %s", "one"])).toBe("one and %s");
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

  it("runs TypeScript and TSX with their types stripped", async () => {
    const page = await runDomInNode(
      `const button = document.querySelector<HTMLButtonElement>("#add")!;
let clicks: number = 0;
button.addEventListener("click", (event: MouseEvent) => {
  clicks += 1;
  button.textContent = \`Clicked \${clicks}\`;
});`,
      '<button id="add">Add</button>',
      [
        {
          name: "click",
          check: '(add.click(), add.textContent === "Clicked 1")',
        },
      ],
      undefined,
      { typescript: true },
    );
    expect(page.error).toBeUndefined();
    expect(page.tests?.[0].passed).toBe(true);

    const react = await runDomInNode(
      `import { useState } from "react";
import { createRoot } from "react-dom/client";
type Props = { label: string };
function Hello<T extends Props>({ label }: T) {
  const [n] = useState<number>(1);
  return <p>{label} {n}</p>;
}
createRoot(document.getElementById("root")!).render(<Hello label="Hi" />);`,
      '<div id="root"></div>',
      [{ name: "renders", check: 'document.body.textContent === "Hi 1"' }],
      undefined,
      { react: true, typescript: true },
    );
    expect(react.error).toBeUndefined();
    expect(react.tests?.[0].passed).toBe(true);
  });

  it("logs requests right away and releases answers a failed check held", async () => {
    const r = await runDomInNode(
      `document.querySelector("#save").addEventListener("click", () => {
  fetch("https://api.pandadev.test/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Nap" }),
  });
});`,
      '<button id="save">Save</button>',
      [
        // logged as soon as the click calls fetch, before the body is read
        {
          name: "logged",
          check:
            '(save.click(), __requests.length === 1 && __requests[0].method === "POST")',
        },
        {
          name: "body",
          check: "(await __settle(), __requests[0].body.title === 'Nap')",
        },
        // fails while answers are held…
        { name: "throws", check: "(__hold(), save.click(), missing.value)" },
        // …and the next check still gets its answer
        {
          name: "next",
          check:
            '(await fetch("https://api.pandadev.test/todos")).status === 200',
        },
      ],
    );
    expect(r.tests?.map((t) => t.passed)).toEqual([true, true, false, true]);
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

describe("React and fetch in the preview", () => {
  const root = '<div id="root"></div>';

  it("renders JSX with state, and checks can click and wait", async () => {
    const code = [
      'import { useState } from "react";',
      'import { createRoot } from "react-dom/client";',
      "function Counter() {",
      "  const [count, setCount] = useState(0);",
      "  return <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>;",
      "}",
      'createRoot(document.getElementById("root")).render(<Counter />);',
    ].join("\n");
    const r = await runDomInNode(
      code,
      root,
      [
        {
          name: "renders",
          check:
            "document.querySelector('button').textContent === 'Clicked 0 times'",
        },
        {
          name: "clicks",
          check:
            "(await __click('button'), await __click('button'), document.querySelector('button').textContent === 'Clicked 2 times')",
        },
      ],
      undefined,
      { react: true },
    );
    expect(r.error).toBeUndefined();
    expect(r.tests?.map((t) => t.passed)).toEqual([true, true]);
  });

  it("lets checks type into controlled inputs", async () => {
    const code = [
      "function Greeter() {",
      '  const [name, setName] = React.useState("");',
      "  return (",
      "    <>",
      "      <input value={name} onChange={(e) => setName(e.target.value)} />",
      "      <p>Hello, {name || 'stranger'}!</p>",
      "    </>",
      "  );",
      "}",
      'ReactDOM.createRoot(document.getElementById("root")).render(<Greeter />);',
    ].join("\n");
    const r = await runDomInNode(
      code,
      root,
      [
        {
          name: "types",
          check:
            "(await __type('input', 'Mei'), document.querySelector('p').textContent === 'Hello, Mei!')",
        },
      ],
      undefined,
      { react: true },
    );
    expect(r.tests?.[0].passed).toBe(true);
  });

  it("shows React's warnings, like a missing key", async () => {
    const code = [
      "const items = ['a', 'b'];",
      "function List() { return <ul>{items.map((i) => <li>{i}</li>)}</ul>; }",
      'ReactDOM.createRoot(document.getElementById("root")).render(<List />);',
    ].join("\n");
    const r = await runDomInNode(code, root, [], undefined, { react: true });
    expect(r.output.map((l) => l.text).join("\n")).toMatch(/unique "key" prop/);
  });

  it("reports JSX syntax errors on the right line", async () => {
    const r = await runDomInNode(
      "const a = 1;\nconst el = <div>;\n",
      root,
      [],
      undefined,
      { react: true },
    );
    expect(r.error).toMatchObject({ name: "SyntaxError", line: 2 });
  });

  it("answers fetch from the practice API and waits for it before checks", async () => {
    const code = [
      "fetch('https://api.pandadev.test/movies?search=bamboo')",
      "  .then((res) => res.json())",
      "  .then((data) => {",
      "    document.querySelector('#out').textContent = data.results.map((m) => m.title).join(', ');",
      "  });",
    ].join("\n");
    const r = await runDomInNode(code, '<p id="out"></p>', [
      {
        name: "shows movies",
        check:
          "document.querySelector('#out').textContent === 'The Bamboo Heist, The Great Bamboo Race'",
      },
      { name: "logged", check: "__requests.length === 1" },
    ]);
    expect(r.error).toBeUndefined();
    expect(r.tests?.map((t) => t.passed)).toEqual([true, true]);
  });
  it("runs a ws server and a React chat client on one page", async () => {
    const code = [
      'import { useEffect, useState } from "react";',
      'import { createRoot } from "react-dom/client";',
      'import { WebSocketServer } from "ws";',
      "const wss = new WebSocketServer({ port: 8080 });",
      "wss.on('connection', (socket) => {",
      "  socket.on('message', (data) => {",
      "    for (const c of wss.clients) c.send('echo: ' + data);",
      "  });",
      "});",
      "function Chat() {",
      "  const [lines, setLines] = useState([]);",
      "  const [ws, setWs] = useState(null);",
      "  useEffect(() => {",
      "    const socket = new WebSocket('ws://localhost:8080');",
      "    socket.onmessage = (e) => setLines((l) => [...l, e.data]);",
      "    setWs(socket);",
      "    return () => socket.close();",
      "  }, []);",
      "  return (",
      "    <>",
      "      <button onClick={() => ws.send('hi')}>Send</button>",
      "      <ul>{lines.map((l, i) => <li key={i}>{l}</li>)}</ul>",
      "    </>",
      "  );",
      "}",
      'createRoot(document.getElementById("root")).render(<Chat />);',
    ].join("\n");
    const r = await runDomInNode(
      code,
      root,
      [
        {
          name: "sends and receives",
          check:
            "(await __click('button'), document.querySelector('li')?.textContent === 'echo: hi')",
        },
      ],
      undefined,
      { react: true },
    );
    expect(r.error).toBeUndefined();
    expect(r.tests?.[0]).toMatchObject({ passed: true });
  });
});

describe("promises in the preview console", () => {
  it("prints them like the worker runner", async () => {
    const r = await runDomInNode(
      [
        "console.log(Promise.resolve(1), 'a');",
        "console.log(new Promise(() => {}));",
        "console.log('last');",
      ].join("\n"),
      "<p></p>",
    );
    expect(r.output.map((l) => l.text)).toEqual([
      "Promise { 1 } a",
      "Promise { <pending> }",
      "last",
    ]);
  });
});
