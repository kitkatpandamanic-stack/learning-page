/**
 * Turns values into text the way Node's console.log does (simplified), so the
 * output learners see matches the outputs printed in lessons.
 */

const MAX_DEPTH = 2;

function quote(s: string) {
  return `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n")}'`;
}

function isPlainKey(key: string) {
  return /^[A-Za-z_$][\w$]*$/.test(key);
}

function inspect(value: unknown, depth: number, seen: Set<unknown>): string {
  if (value === null) return "null";
  switch (typeof value) {
    case "string":
      return depth === 0 ? value : quote(value);
    case "number":
      return Object.is(value, -0) ? "-0" : String(value);
    case "bigint":
      return `${value}n`;
    case "undefined":
      return "undefined";
    case "boolean":
      return String(value);
    case "symbol":
      return value.toString();
    case "function":
      return value.name
        ? `[Function: ${value.name}]`
        : "[Function (anonymous)]";
  }

  const obj = value as object;
  if (seen.has(obj)) return "[Circular]";

  // V8 stacks start with "Name: message"; Firefox and Safari stacks don't.
  if (obj instanceof Error)
    return obj.stack?.startsWith(obj.name)
      ? obj.stack.split("\n")[0]
      : `${obj.name}: ${obj.message}`;
  if (obj instanceof Date)
    return Number.isNaN(obj.getTime()) ? "Invalid Date" : obj.toISOString();
  if (obj instanceof RegExp) return obj.toString();
  if (Object.prototype.toString.call(obj) === "[object Generator]") {
    return "Object [Generator] {}";
  }

  const nested = depth + 1;
  seen.add(obj);
  try {
    if (Array.isArray(obj)) {
      if (obj.length === 0) return "[]";
      if (depth > MAX_DEPTH) return "[Array]";
      return `[ ${obj.map((v) => inspect(v, nested, seen)).join(", ")} ]`;
    }
    if (obj instanceof Map) {
      if (depth > MAX_DEPTH) return "[Map]";
      const entries = [...obj].map(
        ([k, v]) =>
          `${inspect(k, nested, seen)} => ${inspect(v, nested, seen)}`,
      );
      return `Map(${obj.size}) {${entries.length ? ` ${entries.join(", ")} ` : ""}}`;
    }
    if (obj instanceof Set) {
      if (depth > MAX_DEPTH) return "[Set]";
      const items = [...obj].map((v) => inspect(v, nested, seen));
      return `Set(${obj.size}) {${items.length ? ` ${items.join(", ")} ` : ""}}`;
    }

    const ctor = Object.getPrototypeOf(obj)?.constructor;
    const prefix =
      ctor && ctor !== Object && typeof ctor.name === "string" && ctor.name
        ? `${ctor.name} `
        : "";
    const keys = Object.keys(obj);
    if (keys.length === 0) return `${prefix}{}`;
    if (depth > MAX_DEPTH) return prefix ? `[${ctor.name}]` : "[Object]";
    const props = keys.map((key) => {
      const label = isPlainKey(key) ? key : quote(key);
      return `${label}: ${inspect((obj as Record<string, unknown>)[key], nested, seen)}`;
    });
    return `${prefix}{ ${props.join(", ")} }`;
  } finally {
    seen.delete(obj);
  }
}

/**
 * Formats console.log arguments: strings print raw, everything else is
 * inspected. Like Node, a first string argument can hold placeholders
 * (`%s`, `%d`, `%i`, `%f`, `%j`, `%o`, `%O`, `%c`, `%%`), which React's
 * warnings use.
 */
export function formatArgs(args: unknown[]): string {
  let rest = args;
  let head = "";
  if (typeof args[0] === "string" && args[0].includes("%")) {
    let next = 1;
    head = args[0].replace(/%([sdifjoOc%])/g, (match, type: string) => {
      if (type === "%") return "%";
      if (next >= args.length) return match;
      const value = args[next++];
      switch (type) {
        case "s":
          return typeof value === "string"
            ? value
            : typeof value === "object" && value !== null
              ? inspect(value, 1, new Set())
              : inspect(value, 0, new Set());
        case "d":
        case "i": {
          if (typeof value === "object" && value !== null) return "NaN";
          const n = Number(value);
          return inspect(type === "i" ? Math.trunc(n) : n, 0, new Set());
        }
        case "f":
          return inspect(Number.parseFloat(String(value)), 0, new Set());
        case "j":
          try {
            return JSON.stringify(value) ?? "undefined";
          } catch {
            return "[Circular]";
          }
        case "c":
          return "";
        default:
          return inspect(value, 1, new Set());
      }
    });
    rest = args.slice(next);
    if (rest.length === 0) return head;
  }
  const tail = rest.map((arg) => inspect(arg, 0, new Set())).join(" ");
  return args === rest ? tail : `${head} ${tail}`;
}
