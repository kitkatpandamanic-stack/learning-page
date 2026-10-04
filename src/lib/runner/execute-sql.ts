import type { PGlite } from "@electric-sql/pglite";

import {
  MAX_OUTPUT_LINES,
  type ExecuteResult,
  type LogLevel,
  type OutputLine,
  type TestResult,
  type TestSpec,
} from "./execute";

/**
 * SQL side of the runner: PostgreSQL (PGlite) in the browser and in our
 * tests. Every run gets a fresh copy of the sample database (sql-seed.ts),
 * runs the learner's statements one by one like psql does, and prints each
 * result the way psql would: a table for rows, a command tag otherwise.
 */

export type SqlStatement = {
  text: string;
  /** 1-based line of the statement's first character */
  line: number;
  /** Index of the statement's first character in the script */
  offset: number;
};

/**
 * Splits a script into statements at top-level semicolons, skipping
 * semicolons in strings, quoted names, comments and $$ bodies.
 */
export function splitStatements(code: string): SqlStatement[] {
  const statements: SqlStatement[] = [];
  let start = 0;
  let i = 0;
  const push = (end: number) => {
    const raw = code.slice(start, end);
    const lead = raw.length - raw.trimStart().length;
    const text = raw.trim();
    if (text && stripComments(text).trim()) {
      const offset = start + lead;
      statements.push({
        text,
        line: code.slice(0, offset).split("\n").length,
        offset,
      });
    }
  };
  while (i < code.length) {
    const ch = code[i];
    const next = code[i + 1];
    if (ch === "-" && next === "-") {
      const end = code.indexOf("\n", i);
      i = end === -1 ? code.length : end;
    } else if (ch === "/" && next === "*") {
      let depth = 1;
      i += 2;
      while (i < code.length && depth > 0) {
        // PostgreSQL's block comments nest.
        if (code[i] === "/" && code[i + 1] === "*") {
          depth++;
          i += 2;
        } else if (code[i] === "*" && code[i + 1] === "/") {
          depth--;
          i += 2;
        } else i++;
      }
    } else if (ch === "'" || ch === '"') {
      // E'…' strings allow backslash escapes; doubled quotes escape anywhere.
      const backslash = ch === "'" && /[eE]/.test(code[i - 1] ?? "");
      i++;
      while (i < code.length) {
        if (backslash && code[i] === "\\") i += 2;
        else if (code[i] === ch && code[i + 1] === ch) i += 2;
        else if (code[i] === ch) break;
        else i++;
      }
      i++;
    } else if (ch === "$") {
      const tag = /^\$[A-Za-z_]*\$/.exec(code.slice(i));
      if (tag && !/[\w$]/.test(code[i - 1] ?? "")) {
        const end = code.indexOf(tag[0], i + tag[0].length);
        i = end === -1 ? code.length : end + tag[0].length;
      } else i++;
    } else if (ch === ";") {
      push(i);
      start = i + 1;
      i++;
    } else i++;
  }
  push(code.length);
  return statements;
}

function stripComments(sql: string) {
  return sql.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Words of a statement outside parentheses, strings and comments, upper-cased. */
function topLevelWords(sql: string) {
  const words: string[] = [];
  let depth = 0;
  const clean = stripComments(sql).replace(/'(?:[^']|'')*'/g, "''");
  for (const match of clean.matchAll(/[()]|[A-Za-z_]+/g)) {
    if (match[0] === "(") depth++;
    else if (match[0] === ")") depth--;
    else if (depth === 0) words.push(match[0].toUpperCase());
  }
  return words;
}

const CREATE_MODIFIERS = new Set([
  "OR",
  "REPLACE",
  "TEMP",
  "TEMPORARY",
  "UNIQUE",
  "UNLOGGED",
  "GLOBAL",
  "LOCAL",
  "RECURSIVE",
]);

/** psql's message for a statement that returns no rows, e.g. "INSERT 0 3". */
export function commandTag(sql: string, affectedRows = 0) {
  const words = topLevelWords(sql);
  let verb = words[0] ?? "";
  if (verb === "WITH") {
    verb =
      words.find((w) => ["INSERT", "UPDATE", "DELETE", "MERGE"].includes(w)) ??
      "SELECT";
  }
  switch (verb) {
    case "INSERT":
      return `INSERT 0 ${affectedRows}`;
    case "UPDATE":
    case "DELETE":
    case "MERGE":
    case "SELECT":
    case "MOVE":
    case "FETCH":
    case "COPY":
      return `${verb} ${affectedRows}`;
    case "CREATE":
    case "DROP":
    case "ALTER": {
      const rest = words.slice(1).filter((w) => !CREATE_MODIFIERS.has(w));
      if (verb === "CREATE" && words.includes("AS") && rest[0] === "TABLE") {
        // psql says "SELECT 5"; PGlite doesn't report that count.
        return affectedRows ? `SELECT ${affectedRows}` : "CREATE TABLE AS";
      }
      const what =
        rest[0] === "MATERIALIZED" || rest[0] === "FOREIGN"
          ? `${rest[0]} ${rest[1] ?? ""}`
          : (rest[0] ?? "");
      return `${verb} ${what}`.trim();
    }
    case "TRUNCATE":
      return "TRUNCATE TABLE";
    case "START":
      return "START TRANSACTION";
    case "END":
      return "COMMIT";
    case "ABORT":
      return "ROLLBACK";
    default:
      return verb;
  }
}

/** Type OIDs psql right-aligns: integers, numeric, floats, money, oid. */
const NUMERIC_TYPES = new Set([20, 21, 23, 26, 700, 701, 790, 1700]);

/** Rows shown per result; the rest are counted. */
export const MAX_TABLE_ROWS = 100;

/** A result as psql prints it in its default aligned format. */
export function formatTable(
  columns: { name: string; numeric: boolean }[],
  rows: (string | null)[][],
): string[] {
  const shown = rows.slice(0, MAX_TABLE_ROWS);
  const cell = (value: string | null) =>
    value === null ? "NULL" : value.replace(/\r?\n/g, "↵");
  const cells = shown.map((row) => row.map(cell));
  const widths = columns.map((c, i) =>
    Math.max(c.name.length, ...cells.map((row) => row[i].length)),
  );
  const center = (text: string, width: number) => {
    const left = Math.floor((width - text.length) / 2);
    return " ".repeat(left) + text.padEnd(width - left);
  };
  const line = (parts: string[]) => ` ${parts.join(" | ")}`.trimEnd();
  const lines = [
    line(columns.map((c, i) => center(c.name, widths[i]))),
    widths.map((w) => "-".repeat(w + 2)).join("+"),
    ...cells.map((row) =>
      line(
        row.map((value, i) =>
          columns[i].numeric && row[i] !== "NULL"
            ? value.padStart(widths[i])
            : value.padEnd(widths[i]),
        ),
      ),
    ),
  ];
  if (rows.length > shown.length) {
    lines.push(`(${rows.length} rows, showing the first ${shown.length})`);
  } else {
    lines.push(`(${rows.length} ${rows.length === 1 ? "row" : "rows"})`);
  }
  return lines;
}

/** Every type as the text PostgreSQL sends, like psql shows it. */
const RAW_TEXT: Record<number, (value: string) => string> = {};
for (let oid = 0; oid < 10_000; oid++) RAW_TEXT[oid] = (value) => value;

/**
 * A value for exercise checks: numbers, booleans, JSON and arrays become
 * JavaScript values; dates and times stay text ("2025-01-03"), so checks
 * don't depend on the browser's time zone.
 */
export function checkValue(value: string | null, oid: number): unknown {
  if (value === null) return null;
  if (NUMERIC_TYPES.has(oid)) return Number(value);
  if (oid === 16) return value === "t";
  if (oid === 114 || oid === 3802) return JSON.parse(value);
  if (value.startsWith("{") && value.endsWith("}") && oid > 1000) {
    return parseArray(value, ARRAY_ELEMENTS[oid] ?? 25);
  }
  return value;
}

/** Element types of common array types (int4[] → int4, …). */
const ARRAY_ELEMENTS: Record<number, number> = {
  1000: 16,
  1005: 21,
  1007: 23,
  1016: 20,
  1021: 700,
  1022: 701,
  1231: 1700,
  1009: 25,
  1015: 25,
};

/** Parses a one-dimensional array literal like {1,2} or {"a b",c,NULL}. */
function parseArray(text: string, element: number): unknown[] {
  const items: unknown[] = [];
  let i = 1;
  while (i < text.length - 1) {
    let value = "";
    let quoted = false;
    if (text[i] === '"') {
      quoted = true;
      i++;
      while (i < text.length && text[i] !== '"') {
        if (text[i] === "\\") i++;
        value += text[i++];
      }
      i++;
    } else {
      while (i < text.length - 1 && text[i] !== ",") value += text[i++];
    }
    items.push(!quoted && value === "NULL" ? null : checkValue(value, element));
    i++; // the comma
  }
  return items;
}

export type SqlResultSet = {
  columns: string[];
  rows: Record<string, unknown>[];
  command: string;
};

type PgError = Error & {
  position?: string | number;
  hint?: string;
  detail?: string;
};

/**
 * Where in the whole script PostgreSQL stopped: its `position` counts
 * characters (from 1) in the statement.
 */
function errorPlace(code: string, statement: SqlStatement, error: PgError) {
  const position = Number(error.position);
  if (!position) return { line: statement.line };
  const index = statement.offset + position - 1;
  const lineStart = code.lastIndexOf("\n", index - 1) + 1;
  return {
    line: code.slice(0, index).split("\n").length,
    column: index - lineStart,
  };
}

/**
 * Runs a script on `db` (a fresh copy of the sample database) and then the
 * exercise checks. Checks are JavaScript expressions (they may use await)
 * with these names in scope:
 *   rows      the last result's rows, as objects (numbers are numbers)
 *   columns   the last result's column names
 *   results   every result: { columns, rows, command }
 *   query(sql)   runs more SQL on the same database, resolves to rows
 *   lastQuery    the text of the last statement that returned rows
 *   rerun(setup) runs `setup` SQL, then lastQuery again: catches hard-coded answers
 *   __output  the printed lines
 */
export async function executeSql(
  db: PGlite,
  code: string,
  options: { tests?: TestSpec[]; onLine?: (line: OutputLine) => void } = {},
): Promise<ExecuteResult> {
  const { tests = [], onLine } = options;
  const output: OutputLine[] = [];
  let truncated = false;
  const emit = (level: LogLevel, text: string) => {
    if (output.length >= MAX_OUTPUT_LINES) {
      if (!truncated) {
        truncated = true;
        const line: OutputLine = {
          level: "warn",
          text: `Output stopped after ${MAX_OUTPUT_LINES} lines.`,
        };
        output.push(line);
        onLine?.(line);
      }
      return;
    }
    const line: OutputLine = { level, text };
    output.push(line);
    onLine?.(line);
  };

  const results: SqlResultSet[] = [];
  let lastQuery = "";
  let error: ExecuteResult["error"];
  const statements = splitStatements(code);
  for (const [index, statement] of statements.entries()) {
    if (index > 0) emit("log", ""); // a blank line between results
    try {
      const [result] = await db.exec(statement.text, {
        parsers: RAW_TEXT,
        onNotice: (notice) => emit("info", `NOTICE:  ${notice.message}`),
      });
      if (result && result.fields.length > 0) {
        const columns = result.fields.map((f) => ({
          name: f.name,
          numeric: NUMERIC_TYPES.has(f.dataTypeID),
        }));
        const raw = (result.rows as Record<string, string | null>[]).map(
          (row) => result.fields.map((f) => row[f.name] ?? null),
        );
        for (const text of formatTable(columns, raw)) emit("log", text);
        lastQuery = statement.text;
        results.push({
          columns: columns.map((c) => c.name),
          rows: raw.map((row) =>
            Object.fromEntries(
              result.fields.map((f, i) => [
                f.name,
                checkValue(row[i], f.dataTypeID),
              ]),
            ),
          ),
          command: commandTag(statement.text, result.rows.length),
        });
      } else {
        const command = commandTag(statement.text, result?.affectedRows ?? 0);
        emit("log", command);
        results.push({ columns: [], rows: [], command });
      }
    } catch (caught) {
      const e = caught as PgError;
      const { line, column } = errorPlace(code, statement, e);
      emit("error", `ERROR:  ${e.message}`);
      if (column !== undefined) {
        // Like psql: the line, and a caret under where PostgreSQL stopped.
        const prefix = `LINE ${line}: `;
        emit("error", prefix + (code.split("\n")[line - 1] ?? ""));
        emit("error", " ".repeat(prefix.length + column) + "^");
      }
      if (e.detail) emit("error", `DETAIL:  ${e.detail}`);
      if (e.hint) emit("error", `HINT:  ${e.hint}`);
      error = { name: "ERROR", message: e.message, line };
      break; // like psql with ON_ERROR_STOP: later statements don't run
    }
  }

  let testResults: TestResult[] | undefined;
  if (tests.length) {
    const last = [...results].reverse().find((r) => r.columns.length > 0);
    const query = async (sql: string) => {
      const [result] = await db.exec(sql, { parsers: RAW_TEXT });
      if (!result) return [];
      return (result.rows as Record<string, string | null>[]).map((row) =>
        Object.fromEntries(
          result.fields.map((f) => [
            f.name,
            checkValue(row[f.name] ?? null, f.dataTypeID),
          ]),
        ),
      );
    };
    const rerun = async (setup = "") => {
      if (setup) await db.exec(setup);
      return query(lastQuery);
    };
    const printed = output
      .filter((l) => l.level !== "error" && l.level !== "warn")
      .map((l) => l.text);
    testResults = [];
    for (const test of tests) {
      if (error) {
        testResults.push({
          name: test.name,
          passed: false,
          error: "Fix the error in your code first.",
        });
        continue;
      }
      try {
        const check = new Function(
          "rows",
          "columns",
          "results",
          "query",
          "rerun",
          "lastQuery",
          "__output",
          `return (async () => (${test.check}))();`,
        );
        const passed = await check(
          last?.rows ?? [],
          last?.columns ?? [],
          results,
          query,
          rerun,
          lastQuery,
          printed,
        );
        testResults.push({ name: test.name, passed: Boolean(passed) });
      } catch (caught) {
        const e = caught as Error;
        testResults.push({
          name: test.name,
          passed: false,
          // PostgreSQL's errors are named "error"; JavaScript's keep their name.
          error: `${/^error$/i.test(e.name) ? "ERROR" : e.name}: ${e.message}`,
        });
      }
    }
  }

  return { output, error, tests: testResults };
}

/**
 * Creates the sample database and returns a function that opens a fresh
 * copy of it (about 0.1 s each), so every run starts from the same data.
 */
export async function createSqlSandbox(
  create: (options?: { loadDataDir?: Blob | File }) => Promise<PGlite>,
  seed: string,
) {
  const base = await create();
  await base.exec(seed);
  const snapshot = await base.dumpDataDir("none");
  await base.close();
  return () => create({ loadDataDir: snapshot });
}
