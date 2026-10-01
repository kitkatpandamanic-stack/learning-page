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

/** Formats console.log arguments: strings print raw, everything else is inspected. */
export function formatArgs(args: unknown[]): string {
  return args.map((arg) => inspect(arg, 0, new Set())).join(" ");
}
