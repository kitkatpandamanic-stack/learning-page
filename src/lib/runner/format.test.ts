import { format } from "node:util";

import { describe, expect, it } from "vitest";

import { formatArgs, trackProxies } from "./format";

// Expressions whose console.log output must match Node's exactly.
const EXPRESSIONS = [
  '"plain"',
  "42",
  "-0",
  "null",
  "undefined",
  "true",
  "10n",
  "Symbol('a b')",
  '[1, "a", [2, [3, [4]]]]',
  '({ a: 1, "b c": "x", $d: 2, deep: { d: { e: { f: 1 } } } })',
  'new Map([["a", 1], [{ k: 1 }, [1, 2]]])',
  "new Set([1, [2, 3], { a: 1 }])",
  "new Map()",
  "new Set()",
  "new (class Point { constructor() { this.x = 1; } })()",
  "new (class Empty {})()",
  "[]",
  "({})",
  "function foo() {}",
  "(() => 1)",
  "async function load() {}",
  "function* gen() {}",
  "async function* stream() {}",
  "class Animal {}",
  "class extends Array {}",
  "Object.assign(function tagged() {}, { a: 1 })",
  "new Date(0)",
  "/ab+c/g",
  '"it\'s\\nnew"',
  '["it\'s", \'say "hi"\', "both \' \\""]',
  '["tab\\there", "back\\\\slash"]',
  "(function* () { yield 1; })()",
  "Object.create(null)",
  "Object.assign(Object.create(null), { a: 1 })",
  "({ get a() { return 1; }, set b(v) {}, get c() { return 1; }, set c(v) {} })",
  "({ [Symbol('id')]: 1, a: 2 })",
  '"abc".match(/b/)',
  "[1, , 3]",
  "new Array(5)",
  "new Uint8Array([1, 2, 3])",
  "new Uint8Array([1, 2, 3]).buffer",
  "new Float64Array(0)",
  "new WeakMap()",
  "new WeakSet()",
  "new Number(3)",
  "new String('ab')",
  "(() => { const c = { name: 'x' }; c.self = c; return c; })()",
  "(() => { const a = [1]; a.push({ list: a }); return a; })()",
  "Array.from({ length: 30 }, (_, i) => i * 7)",
  "Array.from({ length: 120 }, (_, i) => i)",
  "[100, 200, 400, 800, 1600, 3200, 5000, 5000]",
  "['apple', 'banana', 'cherry', 'dates', 'elderberry', 'fig', 'grape', 'honeydew', 'kiwi']",
  "Array.from({ length: 8 }, (_, i) => ({ id: i }))",
  "({ id: 1, title: 'The Bamboo Heist', year: 2019, director: 'Mei Lin', genres: ['comedy', 'crime'] })",
  "{ results: [{ id: 1, title: 'A long movie title here', year: 2019 }, { id: 2, title: 'Another one', year: 2020 }], page: 1 }",
  "({ a: { b: { c: { d: 1 } } }, arr: [[[[1]]]] })",
  "[undefined, null, -0, 1n]",
  "({ '__proto__': 1 })",
  'JSON.parse(\'{"__proto__": {"admin": true}}\')',
  "new (class Foo { get [Symbol.toStringTag]() { return 'Bar'; } })()",
  "Array.from({ length: 7 }, (_, i) => 'item number ' + i)",
  "new Map(Array.from({ length: 5 }, (_, i) => ['user' + i, { name: 'Name ' + i, age: 20 + i }]))",
];

describe("formatArgs", () => {
  it("prints values exactly like Node's console.log", () => {
    for (const expression of EXPRESSIONS) {
      const value: unknown = (0, eval)(`(${expression})`);
      expect(formatArgs([value]), expression).toBe(format(value));
    }
  });

  it("prints several arguments and placeholders like Node", () => {
    const argLists = [
      '"%s is %d years", "Mei", 3',
      '"%s and %s", "one"',
      '"%i%% done", 42.9',
      '"%s", { a: { b: 1 } }',
      '"%c styled", "color: red"',
      '"%j", { a: 1 }',
      '"%d", {}',
      '"no placeholders", 1, "two"',
      '"%s!", "hi", "extra", 3',
      '"a", { b: 1 }, [2]',
    ];
    for (const args of argLists) {
      const list = (0, eval)(`[${args}]`) as unknown[];
      expect(formatArgs(list), args).toBe(format(...list));
    }
  });

  it("prints a proxy's target without running its traps", () => {
    const TrackedProxy = trackProxies(Proxy);
    const log: string[] = [];
    const proxy = new TrackedProxy(
      { a: 1 },
      {
        get(target, key, receiver) {
          log.push(String(key));
          return Reflect.get(target, key, receiver) as unknown;
        },
      },
    );
    expect(formatArgs([proxy])).toBe("{ a: 1 }");
    expect(log).toEqual([]);
    expect(proxy.a).toBe(1);
    const { proxy: revocable } = TrackedProxy.revocable([1, 2], {});
    expect(formatArgs([revocable])).toBe("[ 1, 2 ]");
    expect(() => (TrackedProxy as unknown as () => void)()).toThrow(TypeError);
  });
});
