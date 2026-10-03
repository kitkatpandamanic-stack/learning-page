import { formatArgs } from "./format";

/**
 * The parts of Vitest that lessons use (`describe`, `it`/`test`, `expect`,
 * `vi.fn`, hooks, fake timers), so `import { … } from "vitest"` works in the
 * browser editor. Tests are collected while the learner's code runs and run
 * afterwards, like `vitest run`, printing a short report.
 */

export type VitestSummary = {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  tests: { name: string; passed: boolean; skipped: boolean; error?: string }[];
};

export class AssertionError extends Error {
  name = "AssertionError";
}

type Fn = (...args: unknown[]) => unknown;

// ---------------------------------------------------------------- equality

type Asymmetric = {
  asymmetricMatch(value: unknown): boolean;
  toString(): string;
};

function isAsymmetric(value: unknown): value is Asymmetric {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Asymmetric).asymmetricMatch === "function"
  );
}

function equals(a: unknown, b: unknown, strict = false): boolean {
  if (isAsymmetric(b)) return b.asymmetricMatch(a);
  if (isAsymmetric(a)) return a.asymmetricMatch(b);
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false;
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) {
    return false;
  }
  if (a instanceof Date || b instanceof Date) {
    return (
      a instanceof Date && b instanceof Date && a.getTime() === b.getTime()
    );
  }
  if (a instanceof RegExp || b instanceof RegExp)
    return String(a) === String(b);
  if (a instanceof Error && b instanceof Error) {
    return a.name === b.name && a.message === b.message;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length && a.every((item, i) => equals(item, b[i], strict))
    );
  }
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [key, value] of a) {
      if (!b.has(key) || !equals(value, b.get(key), strict)) return false;
    }
    return true;
  }
  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false;
    return [...a].every((item) =>
      [...b].some((other) => equals(item, other, strict)),
    );
  }
  const keysOf = (obj: object) =>
    Object.keys(obj).filter(
      (key) => strict || (obj as Record<string, unknown>)[key] !== undefined,
    );
  const aKeys = keysOf(a);
  const bKeys = keysOf(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(b, key) &&
      equals(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
        strict,
      ),
  );
}

/** Does `actual` contain everything in `expected` (objects compared partially)? */
function matchesObject(actual: unknown, expected: unknown): boolean {
  if (isAsymmetric(expected)) return expected.asymmetricMatch(actual);
  if (Array.isArray(expected)) {
    return (
      Array.isArray(actual) &&
      actual.length === expected.length &&
      expected.every((item, i) => matchesObject(actual[i], item))
    );
  }
  if (
    typeof expected === "object" &&
    expected !== null &&
    !(expected instanceof Date)
  ) {
    if (typeof actual !== "object" || actual === null) return false;
    return Object.keys(expected).every((key) =>
      matchesObject(
        (actual as Record<string, unknown>)[key],
        (expected as Record<string, unknown>)[key],
      ),
    );
  }
  return equals(actual, expected);
}

/** Values as Vitest shows them in messages: strings in quotes. */
function show(value: unknown): string {
  if (isAsymmetric(value)) return value.toString();
  return typeof value === "string" ? `'${value}'` : formatArgs([value]);
}

// ---------------------------------------------------------------- mocks

type MockState = {
  calls: unknown[][];
  results: { type: "return" | "throw"; value: unknown }[];
  lastCall: unknown[] | undefined;
};

export type Mock = Fn & {
  mock: MockState;
  _isMockFunction: true;
  getMockName(): string;
  mockName(name: string): Mock;
  mockImplementation(fn: Fn): Mock;
  mockImplementationOnce(fn: Fn): Mock;
  mockReturnValue(value: unknown): Mock;
  mockReturnValueOnce(value: unknown): Mock;
  mockResolvedValue(value: unknown): Mock;
  mockResolvedValueOnce(value: unknown): Mock;
  mockRejectedValue(value: unknown): Mock;
  mockRejectedValueOnce(value: unknown): Mock;
  mockClear(): Mock;
  mockReset(): Mock;
  mockRestore(): void;
};

function isMock(value: unknown): value is Mock {
  return (
    typeof value === "function" && (value as Mock)._isMockFunction === true
  );
}

function createMock(impl?: Fn, restore?: () => void): Mock {
  let implementation = impl;
  let once: Fn[] = [];
  let name = "vi.fn()";
  const state: MockState = { calls: [], results: [], lastCall: undefined };

  const mock = function (this: unknown, ...args: unknown[]) {
    state.calls.push(args);
    state.lastCall = args;
    const run = once.shift() ?? implementation;
    try {
      const value = run ? run.apply(this, args) : undefined;
      state.results.push({ type: "return", value });
      return value;
    } catch (error) {
      state.results.push({ type: "throw", value: error });
      throw error;
    }
  } as Mock;

  const chain = (fn: () => void) => {
    fn();
    return mock;
  };
  Object.assign(mock, {
    mock: state,
    _isMockFunction: true as const,
    getMockName: () => name,
    mockName: (value: string) => chain(() => (name = value)),
    mockImplementation: (fn: Fn) => chain(() => (implementation = fn)),
    mockImplementationOnce: (fn: Fn) => chain(() => once.push(fn)),
    mockReturnValue: (value: unknown) =>
      chain(() => (implementation = () => value)),
    mockReturnValueOnce: (value: unknown) =>
      chain(() => once.push(() => value)),
    mockResolvedValue: (value: unknown) =>
      chain(() => (implementation = () => Promise.resolve(value))),
    mockResolvedValueOnce: (value: unknown) =>
      chain(() => once.push(() => Promise.resolve(value))),
    mockRejectedValue: (value: unknown) =>
      chain(() => (implementation = () => Promise.reject(value))),
    mockRejectedValueOnce: (value: unknown) =>
      chain(() => once.push(() => Promise.reject(value))),
    mockClear: () =>
      chain(() => {
        state.calls = [];
        state.results = [];
        state.lastCall = undefined;
      }),
    mockReset: () =>
      chain(() => {
        mock.mockClear();
        implementation = undefined;
        once = [];
      }),
    mockRestore: () => {
      mock.mockReset();
      restore?.();
    },
  });
  return mock;
}

// ---------------------------------------------------------------- fake timers

type FakeTimer = {
  id: number;
  at: number;
  fn: Fn;
  args: unknown[];
  every?: number;
};

export type TimerFunctions = {
  setTimeout: (fn: Fn, ms?: number, ...args: unknown[]) => unknown;
  clearTimeout: (id: unknown) => void;
  setInterval: (fn: Fn, ms?: number, ...args: unknown[]) => unknown;
  clearInterval: (id: unknown) => void;
};

/** A clock that only moves when the test says so (vi.advanceTimersByTime). */
function createFakeClock(start: number) {
  let now = start;
  let nextId = 1;
  let timers: FakeTimer[] = [];
  const add = (fn: Fn, ms = 0, args: unknown[], every?: number) => {
    const id = nextId++;
    timers.push({ id, at: now + Math.max(0, ms), fn, args, every });
    return id;
  };
  const clear = (id: unknown) => {
    timers = timers.filter((t) => t.id !== id);
  };
  const runDue = (until: number) => {
    for (;;) {
      const due = timers
        .filter((t) => t.at <= until)
        .sort((a, b) => a.at - b.at || a.id - b.id)[0];
      if (!due) break;
      now = due.at;
      if (due.every !== undefined) due.at += Math.max(1, due.every);
      else clear(due.id);
      due.fn(...due.args);
    }
    now = until;
  };
  return {
    now: () => now,
    setNow: (time: number) => {
      now = time;
    },
    functions: {
      setTimeout: (fn: Fn, ms?: number, ...args: unknown[]) =>
        add(fn, ms, args),
      clearTimeout: clear,
      setInterval: (fn: Fn, ms?: number, ...args: unknown[]) =>
        add(fn, ms, args, ms ?? 0),
      clearInterval: clear,
    } satisfies TimerFunctions,
    advance: (ms: number) => runDue(now + ms),
    runAll: () => {
      for (let i = 0; i < 10_000 && timers.length; i++) {
        const next = timers.reduce((a, b) => (a.at <= b.at ? a : b));
        runDue(next.at);
      }
    },
    count: () => timers.length,
  };
}

// ---------------------------------------------------------------- the library

type Hook = () => unknown;
type Suite = {
  name: string;
  parent: Suite | null;
  beforeAll: Hook[];
  afterAll: Hook[];
  beforeEach: Hook[];
  afterEach: Hook[];
  children: (Suite | TestCase)[];
};
type TestCase = {
  name: string;
  fn: Hook | null;
  skip: boolean;
  only: boolean;
  suite: Suite;
};

const isSuite = (node: Suite | TestCase): node is Suite => "children" in node;

/** Replaces %s-style placeholders and $name in test.each titles. */
function eachTitle(title: string, row: unknown, index: number) {
  const values = Array.isArray(row) ? row : [row];
  let next = 0;
  let out = title.replace(/%[sdifjoO#%]/g, (match) => {
    if (match === "%%") return "%";
    if (match === "%#") return String(index);
    const value = values[next++];
    return typeof value === "string" ? value : formatArgs([value]);
  });
  if (row && typeof row === "object" && !Array.isArray(row)) {
    out = out.replace(/\$([A-Za-z_]\w*)/g, (match, key: string) =>
      key in row ? show((row as Record<string, unknown>)[key]) : match,
    );
  }
  return out;
}

/** Like Vitest's default testTimeout: a test that never finishes fails. */
const TEST_TIMEOUT_MS = 5000;
function withTimeout(result: unknown) {
  let id: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    // The real timer (not the learner's, which may be fake).
    id = globalThis.setTimeout(
      () => reject(new Error(`Test timed out in ${TEST_TIMEOUT_MS}ms.`)),
      TEST_TIMEOUT_MS,
    );
  });
  return Promise.race([Promise.resolve(result), timeout]).finally(() =>
    globalThis.clearTimeout(id),
  );
}

export function createVitest(options: {
  print: (level: "log" | "error", text: string) => void;
  /** Switches the learner's timer functions to fake ones, or back with null */
  setTimers: (timers: TimerFunctions | null) => void;
}) {
  const { print, setTimers } = options;
  const root: Suite = {
    name: "",
    parent: null,
    beforeAll: [],
    afterAll: [],
    beforeEach: [],
    afterEach: [],
    children: [],
  };
  let current = root;
  let collected = 0;
  const mocks: Mock[] = [];
  // Async assertions (resolves/rejects) that the test may forget to await.
  const pending = new Set<Promise<void>>();
  const track = (run: () => Promise<void>) => {
    const promise = run();
    pending.add(promise);
    promise.then(
      () => pending.delete(promise),
      () => {
        // Reported by the test that made it, not as an unhandled rejection.
      },
    );
    return promise;
  };
  let clock: ReturnType<typeof createFakeClock> | null = null;
  const realDateNow = Date.now;

  function restoreRealTimers() {
    clock = null;
    setTimers(null);
    Date.now = realDateNow;
  }

  function addTest(
    name: string,
    fn: Hook | undefined,
    flags: Partial<TestCase> = {},
  ) {
    collected++;
    current.children.push({
      name: String(name),
      fn: fn ?? null,
      skip: false,
      only: false,
      suite: current,
      ...flags,
    });
  }

  function describe(name: string, fn: () => void) {
    const suite: Suite = {
      name: String(name),
      parent: current,
      beforeAll: [],
      afterAll: [],
      beforeEach: [],
      afterEach: [],
      children: [],
    };
    current.children.push(suite);
    const parent = current;
    current = suite;
    try {
      fn();
    } finally {
      current = parent;
    }
  }
  describe.only = (name: string, fn: () => void) => {
    describe(name, () => {
      const before = current.children.length;
      fn();
      const mark = (nodes: (Suite | TestCase)[]) =>
        nodes.forEach((child) =>
          isSuite(child) ? mark(child.children) : (child.only = true),
        );
      mark(current.children.slice(before));
    });
  };
  describe.skip = (name: string, fn: () => void) => {
    describe(name, () => {
      const before = current.children.length;
      fn();
      for (const child of current.children.slice(before)) {
        if (!isSuite(child)) child.skip = true;
      }
    });
  };

  const each =
    (register: (name: string, fn: Hook) => void) =>
    (table: unknown[]) =>
    (title: string, fn: Fn) =>
      table.forEach((row, index) =>
        register(eachTitle(title, row, index), () =>
          Array.isArray(row) ? fn(...row) : fn(row),
        ),
      );

  const it = (name: string, fn?: Hook) => addTest(name, fn, { skip: !fn });
  it.skip = (name: string, fn?: Hook) => addTest(name, fn, { skip: true });
  it.only = (name: string, fn?: Hook) => addTest(name, fn, { only: true });
  it.todo = (name: string) => addTest(name, undefined, { skip: true });
  it.each = each(it);
  describe.each = each(describe as (name: string, fn: Hook) => void);

  // ---- expect

  function expect(actual: unknown) {
    const build = (negated: boolean) => {
      const assert = (pass: boolean, message: string, notMessage: string) => {
        if (pass === negated)
          throw new AssertionError(negated ? notMessage : message);
      };
      const spyName = () =>
        isMock(actual) ? actual.getMockName() : show(actual);
      const needMock = () => {
        if (!isMock(actual)) {
          throw new TypeError(
            `${show(actual)} is not a spy or a call to a spy!`,
          );
        }
        return actual;
      };

      const matchers = {
        toBe: (expected: unknown) => {
          const pass = Object.is(actual, expected);
          const hint =
            !pass && equals(actual, expected)
              ? ' // If it should pass with deep equality, replace "toBe" with "toStrictEqual"'
              : " // Object.is equality";
          assert(
            pass,
            `expected ${show(actual)} to be ${show(expected)}${hint}`,
            `expected ${show(actual)} not to be ${show(expected)} // Object.is equality`,
          );
        },
        toEqual: (expected: unknown) =>
          assert(
            equals(actual, expected),
            `expected ${show(actual)} to deeply equal ${show(expected)}`,
            `expected ${show(actual)} to not deeply equal ${show(expected)}`,
          ),
        toStrictEqual: (expected: unknown) =>
          assert(
            equals(actual, expected, true),
            `expected ${show(actual)} to strictly equal ${show(expected)}`,
            `expected ${show(actual)} to not strictly equal ${show(expected)}`,
          ),
        toMatchObject: (expected: unknown) =>
          assert(
            matchesObject(actual, expected),
            `expected ${show(actual)} to match object ${show(expected)}`,
            `expected ${show(actual)} to not match object ${show(expected)}`,
          ),
        toBeTruthy: () =>
          assert(
            Boolean(actual),
            `expected ${show(actual)} to be truthy`,
            `expected ${show(actual)} to not be truthy`,
          ),
        toBeFalsy: () =>
          assert(
            !actual,
            `expected ${show(actual)} to be falsy`,
            `expected ${show(actual)} to not be falsy`,
          ),
        toBeNull: () =>
          assert(
            actual === null,
            `expected ${show(actual)} to be null`,
            `expected ${show(actual)} not to be null`,
          ),
        toBeUndefined: () =>
          assert(
            actual === undefined,
            `expected ${show(actual)} to be undefined`,
            `expected ${show(actual)} not to be undefined`,
          ),
        toBeDefined: () =>
          assert(
            actual !== undefined,
            `expected ${show(actual)} to be defined`,
            `expected ${show(actual)} to be undefined`,
          ),
        toBeNaN: () =>
          assert(
            Number.isNaN(actual),
            `expected ${show(actual)} to be NaN`,
            `expected ${show(actual)} not to be NaN`,
          ),
        toBeTypeOf: (type: string) =>
          assert(
            typeof actual === type,
            `expected ${show(actual)} to be type of '${type}'`,
            `expected ${show(actual)} not to be type of '${type}'`,
          ),
        toBeInstanceOf: (ctor: { name: string; prototype: unknown }) =>
          assert(
            actual instanceof (ctor as unknown as new () => unknown),
            `expected ${show(actual)} to be an instance of ${ctor.name}`,
            `expected ${show(actual)} not to be an instance of ${ctor.name}`,
          ),
        toBeGreaterThan: (n: number) =>
          assert(
            (actual as number) > n,
            `expected ${show(actual)} to be greater than ${show(n)}`,
            `expected ${show(actual)} to not be greater than ${show(n)}`,
          ),
        toBeGreaterThanOrEqual: (n: number) =>
          assert(
            (actual as number) >= n,
            `expected ${show(actual)} to be greater than or equal to ${show(n)}`,
            `expected ${show(actual)} to not be greater than or equal to ${show(n)}`,
          ),
        toBeLessThan: (n: number) =>
          assert(
            (actual as number) < n,
            `expected ${show(actual)} to be less than ${show(n)}`,
            `expected ${show(actual)} to not be less than ${show(n)}`,
          ),
        toBeLessThanOrEqual: (n: number) =>
          assert(
            (actual as number) <= n,
            `expected ${show(actual)} to be less than or equal to ${show(n)}`,
            `expected ${show(actual)} to not be less than or equal to ${show(n)}`,
          ),
        toBeCloseTo: (n: number, digits = 2) =>
          assert(
            Math.abs((actual as number) - n) < 10 ** -digits / 2,
            `expected ${show(actual)} to be close to ${show(n)}`,
            `expected ${show(actual)} to not be close to ${show(n)}`,
          ),
        toContain: (item: unknown) => {
          const pass =
            typeof actual === "string"
              ? actual.includes(String(item))
              : Array.isArray(actual) || actual instanceof Set
                ? [...actual].includes(item)
                : false;
          assert(
            pass,
            `expected ${show(actual)} to include ${show(item)}`,
            `expected ${show(actual)} not to include ${show(item)}`,
          );
        },
        toContainEqual: (item: unknown) =>
          assert(
            Array.isArray(actual) && actual.some((x) => equals(x, item)),
            `expected ${show(actual)} to deep equally contain ${show(item)}`,
            `expected ${show(actual)} to not deep equally contain ${show(item)}`,
          ),
        toHaveLength: (length: number) => {
          const got = (actual as { length?: number } | null)?.length;
          assert(
            got === length,
            `expected ${show(actual)} to have a length of ${length} but got ${got}`,
            `expected ${show(actual)} to not have a length of ${length}`,
          );
        },
        toHaveProperty: (path: string | string[], ...value: unknown[]) => {
          const keys = Array.isArray(path) ? path : path.split(".");
          let target: unknown = actual;
          let found = true;
          for (const key of keys) {
            if (
              target !== null &&
              target !== undefined &&
              key in Object(target)
            ) {
              target = (target as Record<string, unknown>)[key];
            } else {
              found = false;
              break;
            }
          }
          const label = Array.isArray(path) ? path.join(".") : path;
          const pass =
            found && (value.length === 0 || equals(target, value[0]));
          assert(
            pass,
            value.length
              ? `expected ${show(actual)} to have property "${label}" with value ${show(value[0])}`
              : `expected ${show(actual)} to have property "${label}"`,
            `expected ${show(actual)} to not have property "${label}"`,
          );
        },
        toMatch: (pattern: RegExp | string) => {
          const text = String(actual);
          const pass =
            typeof pattern === "string"
              ? text.includes(pattern)
              : pattern.test(text);
          assert(
            pass,
            `expected ${show(actual)} to match ${typeof pattern === "string" ? show(pattern) : String(pattern)}`,
            `expected ${show(actual)} not to match ${typeof pattern === "string" ? show(pattern) : String(pattern)}`,
          );
        },
        toThrow: (expected?: unknown) => {
          let thrown: unknown;
          let threw = false;
          if (typeof actual !== "function") {
            throw new TypeError(`${show(actual)} is not a function`);
          }
          try {
            (actual as Fn)();
          } catch (error) {
            threw = true;
            thrown = error;
          }
          const message =
            thrown instanceof Error ? thrown.message : String(thrown);
          let pass = threw;
          let detail = "to throw an error";
          if (threw && expected !== undefined) {
            if (typeof expected === "string") {
              pass = message.includes(expected);
              detail = `to throw error including '${expected}' but got '${message}'`;
            } else if (expected instanceof RegExp) {
              pass = expected.test(message);
              detail = `to throw error matching ${expected} but got '${message}'`;
            } else if (typeof expected === "function") {
              pass = thrown instanceof (expected as new () => unknown);
              detail = `to throw an error that is an instance of ${(expected as Fn).name}`;
            } else if (expected instanceof Error) {
              pass = message === expected.message;
              detail = `to throw error '${expected.message}' but got '${message}'`;
            }
          }
          assert(
            pass,
            `expected [Function] ${detail}`,
            `expected [Function] to not throw an error but '${message}' was thrown`,
          );
        },
        toHaveBeenCalled: () => {
          const spy = needMock();
          assert(
            spy.mock.calls.length > 0,
            `expected "${spyName()}" to be called at least once`,
            `expected "${spyName()}" to not be called at all, but actually been called ${spy.mock.calls.length} times`,
          );
        },
        toHaveBeenCalledTimes: (times: number) => {
          const spy = needMock();
          assert(
            spy.mock.calls.length === times,
            `expected "${spyName()}" to be called ${times} times, but got ${spy.mock.calls.length} times`,
            `expected "${spyName()}" to not be called ${times} times`,
          );
        },
        toHaveBeenCalledWith: (...args: unknown[]) => {
          const spy = needMock();
          assert(
            spy.mock.calls.some((call) => equals(call, args)),
            `expected "${spyName()}" to be called with arguments: ${show(args)}`,
            `expected "${spyName()}" to not be called with arguments: ${show(args)}`,
          );
        },
        toHaveBeenLastCalledWith: (...args: unknown[]) => {
          const spy = needMock();
          assert(
            equals(spy.mock.lastCall, args),
            `expected last "${spyName()}" call to have been called with ${show(args)}`,
            `expected last "${spyName()}" call to not have been called with ${show(args)}`,
          );
        },
        toHaveBeenNthCalledWith: (n: number, ...args: unknown[]) => {
          const spy = needMock();
          assert(
            equals(spy.mock.calls[n - 1], args),
            `expected ${n}th "${spyName()}" call to have been called with ${show(args)}`,
            `expected ${n}th "${spyName()}" call to not have been called with ${show(args)}`,
          );
        },
        toHaveReturnedWith: (value: unknown) => {
          const spy = needMock();
          assert(
            spy.mock.results.some(
              (r) => r.type === "return" && equals(r.value, value),
            ),
            `expected "${spyName()}" to return with: ${show(value)} at least once`,
            `expected "${spyName()}" to not return with: ${show(value)}`,
          );
        },
      };
      const aliases = {
        toThrowError: matchers.toThrow,
        toBeCalled: matchers.toHaveBeenCalled,
        toBeCalledTimes: matchers.toHaveBeenCalledTimes,
        toBeCalledWith: matchers.toHaveBeenCalledWith,
      };
      return { ...matchers, ...aliases };
    };

    type Matchers = ReturnType<typeof build>;
    type AsyncMatchers = {
      [K in keyof Matchers]: (
        ...args: Parameters<Matchers[K]>
      ) => Promise<void>;
    };
    const settle = async () => {
      if (typeof (actual as Promise<unknown> | null)?.then !== "function") {
        throw new TypeError(`expected promise but got ${show(actual)}`);
      }
      try {
        return { rejected: false, value: await actual };
      } catch (error) {
        return { rejected: true, value: error };
      }
    };
    const wrapAsync = (
      mode: "resolves" | "rejects",
      negated: boolean,
    ): AsyncMatchers & { not: AsyncMatchers } =>
      new Proxy({} as AsyncMatchers & { not: AsyncMatchers }, {
        get: (_, key: string) => {
          if (key === "not") return wrapAsync(mode, !negated);
          return (...args: unknown[]) =>
            track(async () => {
              const { rejected, value } = await settle();
              if (mode === "resolves" && rejected) {
                const reason =
                  value instanceof Error
                    ? `${value.name}: ${value.message}`
                    : formatArgs([value]);
                throw new AssertionError(
                  `promise rejected "${reason}" instead of resolving`,
                );
              }
              if (mode === "rejects" && !rejected) {
                throw new AssertionError(
                  `promise resolved "${formatArgs([value])}" instead of rejecting`,
                );
              }
              // With rejects, toThrow looks at the rejection reason.
              const subject =
                mode === "rejects" &&
                (key === "toThrow" || key === "toThrowError")
                  ? () => {
                      throw value;
                    }
                  : value;
              const inner = expect(subject);
              const matcher = (negated ? inner.not : inner)[
                key as keyof Matchers
              ] as Fn | undefined;
              if (typeof matcher !== "function")
                throw new TypeError(`${key} is not a function`);
              matcher(...args);
            });
        },
      });

    return Object.assign(build(false), {
      not: build(true),
      resolves: wrapAsync("resolves", false),
      rejects: wrapAsync("rejects", false),
    });
  }

  const asymmetric = (
    description: string,
    test: (value: unknown) => boolean,
  ): Asymmetric => ({
    asymmetricMatch: test,
    toString: () => description,
  });
  Object.assign(expect, {
    any: (ctor: { name: string }) =>
      asymmetric(`Any<${ctor.name}>`, (value) => {
        if (ctor === Number)
          return typeof value === "number" || value instanceof Number;
        if (ctor === String)
          return typeof value === "string" || value instanceof String;
        if (ctor === Boolean) return typeof value === "boolean";
        if (ctor === Function) return typeof value === "function";
        if (ctor === Object) return typeof value === "object" && value !== null;
        return value instanceof (ctor as unknown as new () => unknown);
      }),
    anything: () =>
      asymmetric("Anything", (value) => value !== null && value !== undefined),
    stringContaining: (text: string) =>
      asymmetric(
        `StringContaining '${text}'`,
        (value) => typeof value === "string" && value.includes(text),
      ),
    stringMatching: (pattern: RegExp | string) =>
      asymmetric(
        `StringMatching ${String(pattern)}`,
        (value) => typeof value === "string" && new RegExp(pattern).test(value),
      ),
    objectContaining: (partial: object) =>
      asymmetric(
        `ObjectContaining ${show(partial)}`,
        (value) => matchesObject(value, partial) && typeof value === "object",
      ),
    arrayContaining: (items: unknown[]) =>
      asymmetric(
        `ArrayContaining ${show(items)}`,
        (value) =>
          Array.isArray(value) &&
          items.every((item) => value.some((v) => equals(v, item))),
      ),
  });

  // ---- vi

  const vi = {
    fn: (impl?: Fn) => {
      const mock = createMock(impl);
      mocks.push(mock);
      return mock;
    },
    spyOn: (object: Record<string, unknown>, method: string) => {
      const original = object[method];
      if (typeof original !== "function") {
        throw new TypeError(
          `${method} is not a function on the object you passed to vi.spyOn`,
        );
      }
      const spy = createMock(
        (...args: unknown[]) => (original as Fn).apply(object, args),
        () => {
          object[method] = original;
        },
      );
      spy.mockName(method);
      object[method] = spy;
      mocks.push(spy);
      return spy;
    },
    isMockFunction: isMock,
    clearAllMocks: () => mocks.forEach((m) => m.mockClear()),
    resetAllMocks: () => mocks.forEach((m) => m.mockReset()),
    restoreAllMocks: () => mocks.forEach((m) => m.mockRestore()),
    useFakeTimers: () => {
      clock = createFakeClock(realDateNow());
      const fake = clock;
      setTimers(fake.functions);
      Date.now = () => fake.now();
      return vi;
    },
    useRealTimers: () => {
      restoreRealTimers();
      return vi;
    },
    advanceTimersByTime: (ms: number) => {
      if (!clock)
        throw new Error(
          'Timers are not mocked. Try calling "vi.useFakeTimers()" first.',
        );
      clock.advance(ms);
      return vi;
    },
    runAllTimers: () => {
      if (!clock)
        throw new Error(
          'Timers are not mocked. Try calling "vi.useFakeTimers()" first.',
        );
      clock.runAll();
      return vi;
    },
    advanceTimersByTimeAsync: async (ms: number) => {
      vi.advanceTimersByTime(ms);
      await Promise.resolve();
      return vi;
    },
    runAllTimersAsync: async () => {
      vi.runAllTimers();
      await Promise.resolve();
      return vi;
    },
    getTimerCount: () => clock?.count() ?? 0,
    setSystemTime: (time: number | Date) => {
      if (!clock)
        throw new Error(
          'Timers are not mocked. Try calling "vi.useFakeTimers()" first.',
        );
      clock.setNow(typeof time === "number" ? time : time.getTime());
      return vi;
    },
  };

  // ---- running

  const fullName = (test: TestCase) => {
    const names: string[] = [];
    for (let s: Suite | null = test.suite; s; s = s.parent)
      if (s.name) names.unshift(s.name);
    return [...names, test.name].join(" > ");
  };

  const errorText = (error: unknown) =>
    error instanceof AssertionError
      ? error.message
      : error instanceof Error
        ? `${error.name}: ${error.message}`
        : `Uncaught ${formatArgs([error])}`;

  async function run(): Promise<VitestSummary> {
    const summary: VitestSummary = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: [],
    };
    const all: TestCase[] = [];
    const walk = (suite: Suite) =>
      suite.children.forEach((child) =>
        isSuite(child) ? walk(child) : all.push(child),
      );
    walk(root);
    const onlyMode = all.some((t) => t.only);

    const chain = (suite: Suite | null): Suite[] => {
      const list: Suite[] = [];
      for (let s = suite; s; s = s.parent) list.unshift(s);
      return list;
    };

    async function runSuite(suite: Suite) {
      const tests: TestCase[] = [];
      const collect = (s: Suite) =>
        s.children.forEach((c) => (isSuite(c) ? collect(c) : tests.push(c)));
      collect(suite);
      const active = tests.some((t) => !(t.skip || (onlyMode && !t.only)));
      let hookError: unknown;
      if (active) {
        for (const hook of suite.beforeAll) {
          try {
            await hook();
          } catch (error) {
            hookError ??= error;
          }
        }
      }
      for (const child of suite.children) {
        if (isSuite(child)) {
          await runSuite(child);
          continue;
        }
        const name = fullName(child);
        summary.total++;
        if (child.skip || !child.fn || (onlyMode && !child.only)) {
          summary.skipped++;
          summary.tests.push({ name, passed: false, skipped: true });
          print("log", `↓ ${name} [skipped]`);
          continue;
        }
        let failure: unknown = hookError;
        const suites = chain(child.suite);
        if (failure === undefined) {
          try {
            for (const s of suites)
              for (const hook of s.beforeEach) await hook();
            await withTimeout(child.fn());
          } catch (error) {
            failure = error;
          }
          // `expect(…).rejects…` without await: still check it, like Vitest.
          const forgotten = [...pending];
          pending.clear();
          for (const result of await Promise.allSettled(forgotten)) {
            if (result.status === "rejected") failure ??= result.reason;
          }
          for (const s of [...suites].reverse()) {
            for (const hook of s.afterEach) {
              try {
                await hook();
              } catch (error) {
                failure ??= error;
              }
            }
          }
        }
        if (clock) restoreRealTimers(); // each test starts with real timers
        if (failure === undefined) {
          summary.passed++;
          summary.tests.push({ name, passed: true, skipped: false });
          print("log", `✓ ${name}`);
        } else {
          summary.failed++;
          const error = errorText(failure);
          summary.tests.push({ name, passed: false, skipped: false, error });
          print("error", `× ${name}`);
          print("error", `  → ${error}`);
        }
      }
      if (active) {
        for (const hook of suite.afterAll) {
          try {
            await hook();
          } catch {
            // afterAll failures don't change test results here
          }
        }
      }
    }

    await runSuite(root);
    restoreRealTimers();
    const parts = [
      summary.failed && `${summary.failed} failed`,
      summary.passed && `${summary.passed} passed`,
      summary.skipped && `${summary.skipped} skipped`,
    ].filter(Boolean);
    print("log", "");
    print(
      summary.failed ? "error" : "log",
      `Tests  ${parts.join(" | ") || "0 passed"} (${summary.total})`,
    );
    return summary;
  }

  const hook =
    (key: "beforeAll" | "afterAll" | "beforeEach" | "afterEach") =>
    (fn: Hook) => {
      current[key].push(fn);
    };

  const api = {
    describe,
    it,
    test: it,
    expect,
    vi,
    beforeAll: hook("beforeAll"),
    afterAll: hook("afterAll"),
    beforeEach: hook("beforeEach"),
    afterEach: hook("afterEach"),
  };

  return {
    module: { ...api, default: api, __esModule: true },
    hasTests: () => collected > 0,
    run,
    /** Undo fake timers if the code left them on outside a test */
    cleanup: restoreRealTimers,
  };
}
