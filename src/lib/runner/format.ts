/**
 * Turns values into text the way Node's console.log does (util.inspect with
 * its defaults: depth 2, lines broken at 80 characters, long number arrays
 * grouped into columns), so the output learners see matches the outputs
 * printed in lessons and what they'd get running the code in Node.
 *
 * Everything lives inside createFormatter() so the preview page can run the
 * very same code: dom-harness.ts puts `createFormatter.toString()` into the
 * page. So the function must not use anything from outside itself.
 */

export type Formatter = {
  /** Formats console.log arguments, including %s-style placeholders */
  formatArgs(args: ArrayLike<unknown>): string;
  /** Wraps the Proxy constructor so printed proxies show their target, like Node */
  trackProxies(proxy: ProxyConstructor): ProxyConstructor;
};

export function createFormatter(
  /** Formats special values (e.g. DOM nodes); return undefined for the rest */
  special?: (
    value: object,
    quote: (s: string) => string,
    depth: number,
  ) => string | undefined,
): Formatter {
  const BREAK_LENGTH = 80;
  const MAX_DEPTH = 2;
  const MAX_ARRAY_LENGTH = 100;
  const KEY = /^[a-zA-Z_][a-zA-Z_0-9]*$/;
  const proxyTargets = new WeakMap<object, object>();

  type Ctx = {
    depth: number;
    indentationLvl: number;
    seen: object[];
    circular: Map<object, number> | undefined;
  };

  const META: Record<string, string> = {
    "\b": "\\b",
    "\t": "\\t",
    "\n": "\\n",
    "\f": "\\f",
    "\r": "\\r",
    "\\": "\\\\",
  };
  // Like Node: single quotes, unless the text has some; then " or `.
  function quote(s: string) {
    let q = "'";
    if (s.includes("'")) {
      if (!s.includes('"')) q = '"';
      else if (!s.includes("`") && !s.includes("${")) q = "`";
    }
    const escaped = s.replace(/[\x00-\x1f\x27\x5c\x7f]/g, (c) => {
      if (c === "'") return q === "'" ? "\\'" : c;
      if (META[c]) return META[c];
      return (
        "\\x" + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")
      );
    });
    return q + escaped + q;
  }

  function constructorName(obj: object): string | null {
    let proto: object | null = obj;
    while (proto !== null) {
      const descriptor = Object.getOwnPropertyDescriptor(proto, "constructor");
      if (
        descriptor &&
        typeof descriptor.value === "function" &&
        descriptor.value.name !== ""
      ) {
        return descriptor.value.name as string;
      }
      proto = Object.getPrototypeOf(proto);
    }
    return null;
  }

  function toStringTag(obj: object, ctor: string | null) {
    let tag: unknown;
    try {
      tag = (obj as Record<symbol, unknown>)[Symbol.toStringTag];
    } catch {
      return "";
    }
    return typeof tag === "string" && tag !== "" && tag !== ctor ? tag : "";
  }

  /** "Foo ", "Foo [Tag] ", "[Object: null prototype] " */
  function prefix(
    ctor: string | null,
    tag: string,
    fallback: string,
    size = "",
  ) {
    if (ctor === null) {
      return tag !== ""
        ? `[${fallback}${size}: null prototype] [${tag}] `
        : `[${fallback}${size}: null prototype] `;
    }
    return tag !== "" ? `${ctor}${size} [${tag}] ` : `${ctor}${size} `;
  }

  function functionBase(fn: (...args: unknown[]) => unknown) {
    let source = "";
    try {
      source = Function.prototype.toString.call(fn);
    } catch {
      // keep going
    }
    if (source.startsWith("class") && source.endsWith("}")) {
      let base = `[class ${fn.name || "(anonymous)"}`;
      const parent = Object.getPrototypeOf(fn) as { name?: string } | null;
      if (parent && parent.name) base += ` extends ${parent.name}`;
      return base + "]";
    }
    const kind = constructorName(fn);
    const type =
      kind === "AsyncFunction" ||
      kind === "GeneratorFunction" ||
      kind === "AsyncGeneratorFunction"
        ? kind
        : "Function";
    return fn.name ? `[${type}: ${fn.name}]` : `[${type} (anonymous)]`;
  }

  function formatPrimitive(value: unknown, ctx: Ctx): string {
    switch (typeof value) {
      case "string":
        return quote(value);
      case "number":
        return Object.is(value, -0) ? "-0" : String(value);
      case "bigint":
        return `${value}n`;
      case "symbol":
        return value.toString();
      default:
        void ctx;
        return String(value);
    }
  }

  function formatValue(value: unknown, recurseTimes: number, ctx: Ctx): string {
    if (
      value === null ||
      (typeof value !== "object" && typeof value !== "function")
    ) {
      return formatPrimitive(value, ctx);
    }
    let obj = value as object;
    const target = proxyTargets.get(obj);
    if (target) obj = target;
    if (ctx.seen.includes(obj)) {
      ctx.circular ??= new Map();
      let index = ctx.circular.get(obj);
      if (index === undefined) {
        index = ctx.circular.size + 1;
        ctx.circular.set(obj, index);
      }
      return `[Circular *${index}]`;
    }
    return formatRaw(obj, recurseTimes, ctx);
  }

  function formatProperty(
    obj: object,
    key: string | symbol,
    recurseTimes: number,
    ctx: Ctx,
    arrayItem = false,
  ) {
    const descriptor = Object.getOwnPropertyDescriptor(obj, key) ?? {
      value: (obj as Record<string | symbol, unknown>)[key],
    };
    let str: string;
    if ("value" in descriptor) {
      ctx.indentationLvl += 2;
      str = formatValue(descriptor.value, recurseTimes, ctx);
      ctx.indentationLvl -= 2;
    } else if (descriptor.get) {
      str = descriptor.set ? "[Getter/Setter]" : "[Getter]";
    } else if (descriptor.set) {
      str = "[Setter]";
    } else {
      str = "undefined";
    }
    if (arrayItem) return str;
    const name =
      typeof key === "symbol"
        ? key.toString()
        : key === "__proto__"
          ? "['__proto__']"
          : KEY.test(key)
            ? key
            : quote(key);
    return `${name}: ${str}`;
  }

  function ownKeys(obj: object, skipIndexes: boolean) {
    const keys: (string | symbol)[] = Object.keys(obj).filter(
      (k) => !skipIndexes || !/^(0|[1-9][0-9]*)$/.test(k),
    );
    for (const symbol of Object.getOwnPropertySymbols(obj)) {
      if (Object.prototype.propertyIsEnumerable.call(obj, symbol))
        keys.push(symbol);
    }
    return keys;
  }

  function formatArrayItems(
    list: ArrayLike<unknown>,
    recurseTimes: number,
    ctx: Ctx,
  ) {
    const output: string[] = [];
    const shown = Math.min(list.length, MAX_ARRAY_LENGTH);
    let holes = 0;
    const flushHoles = () => {
      if (holes > 0) {
        output.push(`<${holes} empty item${holes > 1 ? "s" : ""}>`);
        holes = 0;
      }
    };
    let i = 0;
    for (; i < list.length && output.length < shown; i++) {
      if (!Object.prototype.hasOwnProperty.call(list, i)) {
        holes++;
        continue;
      }
      flushHoles();
      output.push(
        formatProperty(list as object, String(i), recurseTimes, ctx, true),
      );
    }
    flushHoles();
    const remaining = list.length - i;
    if (remaining > 0) {
      output.push(`... ${remaining} more item${remaining > 1 ? "s" : ""}`);
    }
    return output;
  }

  function formatRaw(value: object, recurseTimes: number, ctx: Ctx): string {
    const custom = special?.(value, quote, recurseTimes);
    if (custom !== undefined) return custom;

    const ctor = constructorName(value);
    const tag = toStringTag(value, ctor);
    const tagName = Object.prototype.toString.call(value).slice(8, -1);
    let base = "";
    let braces: [string, string];
    let output: string[] = [];
    let isArrayLike = false;
    let keys: (string | symbol)[] = [];
    let format: () => string[] = () => [];

    if (Array.isArray(value)) {
      keys = ownKeys(value, true);
      const pre =
        ctor !== "Array" || tag !== ""
          ? prefix(ctor, tag, "Array", `(${value.length})`)
          : "";
      braces = [`${pre}[`, "]"];
      if (value.length === 0 && keys.length === 0) return `${braces[0]}]`;
      isArrayLike = true;
      format = () => formatArrayItems(value, recurseTimes, ctx);
    } else if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
      const typed = value as unknown as ArrayLike<number>;
      keys = ownKeys(value, true);
      braces = [
        `${prefix(ctor, tag, "TypedArray", `(${typed.length})`)}[`,
        "]",
      ];
      if (typed.length === 0 && keys.length === 0) return `${braces[0]}]`;
      isArrayLike = true;
      format = () => formatArrayItems(typed, recurseTimes, ctx);
    } else if (value instanceof Map) {
      keys = ownKeys(value, false);
      const pre = prefix(ctor, tag, "Map", `(${value.size})`);
      braces = [`${pre}{`, "}"];
      if (value.size === 0 && keys.length === 0) return `${braces[0]}}`;
      format = () => {
        const entries: string[] = [];
        ctx.indentationLvl += 2;
        for (const [k, v] of value) {
          entries.push(
            `${formatValue(k, recurseTimes, ctx)} => ${formatValue(v, recurseTimes, ctx)}`,
          );
        }
        ctx.indentationLvl -= 2;
        return entries;
      };
    } else if (value instanceof Set) {
      keys = ownKeys(value, false);
      const pre = prefix(ctor, tag, "Set", `(${value.size})`);
      braces = [`${pre}{`, "}"];
      if (value.size === 0 && keys.length === 0) return `${braces[0]}}`;
      format = () => {
        const entries: string[] = [];
        ctx.indentationLvl += 2;
        for (const v of value) entries.push(formatValue(v, recurseTimes, ctx));
        ctx.indentationLvl -= 2;
        return entries;
      };
    } else {
      keys = ownKeys(value, false);
      braces = ["{", "}"];
      if (typeof value === "function") {
        base = functionBase(value as (...args: unknown[]) => unknown);
        if (keys.length === 0) return base;
      } else if (tagName === "RegExp" && value instanceof RegExp) {
        base = RegExp.prototype.toString.call(value);
        if (keys.length === 0) return base;
      } else if (value instanceof Date) {
        base = Number.isNaN(value.getTime())
          ? "Invalid Date"
          : value.toISOString();
        if (keys.length === 0) return base;
      } else if (value instanceof Error) {
        // Node prints the whole stack; its first line is what matters here.
        // (V8 stacks start with "Name: message"; Firefox and Safari's don't.)
        const stack = typeof value.stack === "string" ? value.stack : "";
        return stack.startsWith(value.name)
          ? stack.split("\n")[0]
          : `${value.name}: ${value.message}`;
      } else if (value instanceof WeakMap || value instanceof WeakSet) {
        return `${prefix(ctor, tag, tagName)}{ <items unknown> }`;
      } else if (value instanceof ArrayBuffer) {
        const bytes = [...new Uint8Array(value).slice(0, 50)]
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ");
        const more =
          value.byteLength > 50
            ? ` ... ${value.byteLength - 50} more bytes`
            : "";
        return `${prefix(ctor, tag, "ArrayBuffer")}{ [Uint8Contents]: <${bytes}${more}>, [byteLength]: ${value.byteLength} }`;
      } else if (
        value instanceof Number ||
        value instanceof String ||
        value instanceof Boolean ||
        (typeof Symbol === "function" &&
          tagName === "Symbol" &&
          typeof value.valueOf() === "symbol")
      ) {
        const primitive = (value as { valueOf(): unknown }).valueOf();
        const type =
          typeof primitive === "string"
            ? "String"
            : typeof primitive === "number"
              ? "Number"
              : typeof primitive === "boolean"
                ? "Boolean"
                : "Symbol";
        base = `[${type}: ${formatPrimitive(primitive, ctx)}]`;
        if (type === "String") {
          keys = keys.filter(
            (k) => typeof k !== "string" || !/^(0|[1-9][0-9]*)$/.test(k),
          );
        }
        if (keys.length === 0) return base;
      } else {
        const pre =
          ctor === "Object" && tag === "" ? "" : prefix(ctor, tag, "Object");
        braces = [`${pre}{`, "}"];
        if (keys.length === 0) return `${braces[0]}}`;
      }
    }

    if (recurseTimes > ctx.depth) {
      return ctor === null
        ? "[Object: null prototype]"
        : `[${ctor || tag || "Object"}]`;
    }

    recurseTimes += 1;
    ctx.seen.push(value);
    try {
      output = format();
      for (const key of keys) {
        output.push(formatProperty(value, key, recurseTimes, ctx));
      }
    } finally {
      ctx.seen.pop();
    }

    if (ctx.circular) {
      const index = ctx.circular.get(value);
      if (index !== undefined) {
        const reference = `<ref *${index}>`;
        base = base === "" ? reference : `${reference} ${base}`;
      }
    }
    return reduceToSingleString(ctx, output, base, braces, isArrayLike, value);
  }

  // Node puts long number lists into aligned columns.
  function groupArrayElements(ctx: Ctx, output: string[], value: unknown) {
    let totalLength = 0;
    let maxLength = 0;
    let outputLength = output.length;
    if (output.length > 0 && output[output.length - 1].startsWith("... ")) {
      outputLength--;
    }
    const separatorSpace = 2;
    const dataLen: number[] = [];
    for (let i = 0; i < outputLength; i++) {
      const len = output[i].length;
      dataLen[i] = len;
      totalLength += len + separatorSpace;
      if (maxLength < len) maxLength = len;
    }
    const actualMax = maxLength + separatorSpace;
    if (
      actualMax * 3 + ctx.indentationLvl < BREAK_LENGTH &&
      (totalLength / actualMax > 5 || maxLength <= 6)
    ) {
      const averageBias = Math.sqrt(actualMax - totalLength / output.length);
      const biasedMax = Math.max(actualMax - 3 - averageBias, 1);
      const columns = Math.min(
        Math.round(Math.sqrt(2.5 * biasedMax * outputLength) / biasedMax),
        Math.floor((BREAK_LENGTH - ctx.indentationLvl) / actualMax),
        3 * 4,
        15,
      );
      if (columns <= 1) return output;
      const tmp: string[] = [];
      const maxLineLength: number[] = [];
      for (let i = 0; i < columns; i++) {
        let lineLength = 0;
        for (let j = i; j < output.length; j += columns) {
          if (dataLen[j] > lineLength) lineLength = dataLen[j];
        }
        maxLineLength.push(lineLength + separatorSpace);
      }
      let padStart = true;
      const list = value as ArrayLike<unknown>;
      for (let i = 0; i < output.length; i++) {
        if (typeof list[i] !== "number" && typeof list[i] !== "bigint") {
          padStart = false;
          break;
        }
      }
      for (let i = 0; i < outputLength; i += columns) {
        const max = Math.min(i + columns, outputLength);
        let str = "";
        let j = i;
        for (; j < max - 1; j++) {
          const cell = `${output[j]}, `;
          str += padStart
            ? cell.padStart(maxLineLength[j - i], " ")
            : cell.padEnd(maxLineLength[j - i], " ");
        }
        str += padStart
          ? output[j].padStart(maxLineLength[j - i] - separatorSpace, " ")
          : output[j];
        tmp.push(str);
      }
      if (outputLength < output.length) tmp.push(output[outputLength]);
      return tmp;
    }
    return output;
  }

  function reduceToSingleString(
    ctx: Ctx,
    output: string[],
    base: string,
    braces: [string, string],
    isArrayLike: boolean,
    value: unknown,
  ) {
    const entries = output.length;
    if (isArrayLike && entries > 6) {
      output = groupArrayElements(ctx, output, value);
    }
    if (entries === output.length) {
      // One line, if it fits within 80 characters (and has no line breaks).
      const start =
        output.length +
        ctx.indentationLvl +
        braces[0].length +
        base.length +
        10;
      let totalLength = output.length + start;
      let fits = totalLength + output.length <= BREAK_LENGTH;
      for (let i = 0; fits && i < output.length; i++) {
        totalLength += output[i].length;
        if (totalLength > BREAK_LENGTH) fits = false;
      }
      if (fits && !base.includes("\n")) {
        const joined = output.join(", ");
        if (!joined.includes("\n")) {
          return `${base ? `${base} ` : ""}${braces[0]} ${joined} ${braces[1]}`;
        }
      }
    }
    const indentation = `\n${" ".repeat(ctx.indentationLvl)}`;
    return `${base ? `${base} ` : ""}${braces[0]}${indentation}  ${output.join(`,${indentation}  `)}${indentation}${braces[1]}`;
  }

  function inspect(value: unknown, depth = MAX_DEPTH) {
    return formatValue(value, 0, {
      depth,
      indentationLvl: 0,
      seen: [],
      circular: undefined,
    });
  }

  function formatArgs(argsLike: ArrayLike<unknown>) {
    const args = Array.prototype.slice.call(argsLike) as unknown[];
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
            if (typeof value === "string") return value;
            if (typeof value === "bigint") return `${value}n`;
            if (typeof value === "symbol") return value.toString();
            if (typeof value === "object" && value !== null) {
              return inspect(value, 0);
            }
            return formatPrimitive(value, {} as Ctx);
          case "d":
          case "i": {
            if (typeof value === "object" && value !== null) return "NaN";
            const n = Number(value);
            return formatPrimitive(type === "i" ? Math.trunc(n) : n, {} as Ctx);
          }
          case "f":
            return formatPrimitive(Number.parseFloat(String(value)), {} as Ctx);
          case "j":
            try {
              return JSON.stringify(value) ?? "undefined";
            } catch {
              return "[Circular]";
            }
          case "c":
            return "";
          case "o":
            return inspect(value, 4);
          default:
            return inspect(value);
        }
      });
      rest = args.slice(next);
      if (rest.length === 0) return head;
    }
    const tail = rest
      .map((arg) => (typeof arg === "string" ? arg : inspect(arg)))
      .join(" ");
    return args === rest ? tail : `${head} ${tail}`;
  }

  function trackProxies(OriginalProxy: ProxyConstructor): ProxyConstructor {
    const remember = <T extends object>(proxy: T, target: object) => {
      proxyTargets.set(proxy, proxyTargets.get(target) ?? target);
      return proxy;
    };
    return new OriginalProxy(OriginalProxy, {
      construct(Target, args) {
        const proxy = Reflect.construct(Target, args) as object;
        return remember(proxy, args[0] as object);
      },
      get(Target, key, receiver) {
        if (key === "revocable") {
          return (target: object, handler: ProxyHandler<object>) => {
            const result = Target.revocable(target, handler);
            remember(result.proxy, target);
            return result;
          };
        }
        return Reflect.get(Target, key, receiver) as unknown;
      },
    });
  }

  return { formatArgs, trackProxies };
}

const formatter = createFormatter();

/**
 * Formats console.log arguments: strings print raw, everything else is
 * inspected. Like Node, a first string argument can hold placeholders
 * (`%s`, `%d`, `%i`, `%f`, `%j`, `%o`, `%O`, `%c`, `%%`), which React's
 * warnings use.
 */
export const formatArgs = (args: unknown[]) => formatter.formatArgs(args);

/** For the runner: a Proxy constructor whose proxies print like Node's. */
export const trackProxies = formatter.trackProxies;
