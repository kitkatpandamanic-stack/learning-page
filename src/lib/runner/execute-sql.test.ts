import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

import type { TestSpec } from "./execute";
import {
  commandTag,
  createSqlSandbox,
  executeSql,
  formatTable,
  splitStatements,
} from "./execute-sql";
import { SQL_SEED } from "./sql-seed";

let open: () => Promise<PGlite>;
beforeAll(async () => {
  open = await createSqlSandbox((options) => PGlite.create(options), SQL_SEED);
}, 60_000);

async function run(code: string, tests?: TestSpec[]) {
  const db = await open();
  try {
    return await executeSql(db, code, { tests });
  } finally {
    await db.close();
  }
}

const texts = (r: Awaited<ReturnType<typeof run>>) =>
  r.output.map((l) => l.text);

describe("splitStatements", () => {
  it("splits at top-level semicolons only", () => {
    const code = [
      "SELECT 'a;b'; -- a comment; still a comment",
      '/* block; comment */ SELECT "odd;name" FROM t;',
      "DO $$ BEGIN PERFORM 1; END $$;",
      "",
      "SELECT E'it\\'s;'",
    ].join("\n");
    expect(splitStatements(code).map((s) => [s.line, s.text])).toEqual([
      [1, "SELECT 'a;b'"],
      [
        1,
        '-- a comment; still a comment\n/* block; comment */ SELECT "odd;name" FROM t',
      ],
      [3, "DO $$ BEGIN PERFORM 1; END $$"],
      [5, "SELECT E'it\\'s;'"],
    ]);
  });

  it("skips empty and comment-only statements", () => {
    expect(splitStatements(";;\n-- just a note\n")).toEqual([]);
  });
});

describe("psql-style output", () => {
  it("aligns numbers right and text left, with centred headers", () => {
    expect(
      formatTable(
        [
          { name: "id", numeric: true },
          { name: "name", numeric: false },
          { name: "city", numeric: false },
        ],
        [
          ["1", "Mei Lin", "London"],
          ["14", "Zara Khan", null],
        ],
      ),
    ).toEqual([
      " id |   name    |  city",
      "----+-----------+--------",
      "  1 | Mei Lin   | London",
      " 14 | Zara Khan | NULL",
      "(2 rows)",
    ]);
  });

  it("names commands like psql", () => {
    expect(commandTag("insert into t values (1), (2)", 2)).toBe("INSERT 0 2");
    expect(commandTag("CREATE UNIQUE INDEX i ON t (x)")).toBe("CREATE INDEX");
    expect(commandTag("create or replace view v as select 1")).toBe(
      "CREATE VIEW",
    );
    expect(commandTag("CREATE TABLE t2 AS SELECT * FROM t", 5)).toBe(
      "SELECT 5",
    );
    expect(commandTag("CREATE TABLE t2 AS SELECT * FROM t")).toBe(
      "CREATE TABLE AS",
    );
    expect(commandTag("drop materialized view if exists m")).toBe(
      "DROP MATERIALIZED VIEW",
    );
    expect(commandTag("WITH x AS (SELECT 1) DELETE FROM t", 3)).toBe(
      "DELETE 3",
    );
    expect(commandTag("begin")).toBe("BEGIN");
  });
});

describe("executeSql", () => {
  it("prints each result and starts from the sample database", async () => {
    const r = await run(
      "SELECT name, price FROM products WHERE price > 30 ORDER BY price;\nCREATE TABLE notes (body text);\nINSERT INTO notes VALUES ('a'), ('b');",
    );
    expect(r.error).toBeUndefined();
    expect(texts(r)).toEqual([
      "    name     | price",
      "-------------+-------",
      " Tea Pot     | 32.00",
      " Rice Cooker | 89.90",
      "(2 rows)",
      "",
      "CREATE TABLE",
      "",
      "INSERT 0 2",
    ]);
  }, 30_000);

  it("gives every run a fresh copy of the data", async () => {
    await run("DELETE FROM order_items; DELETE FROM orders;");
    expect(texts(await run("SELECT count(*) FROM orders"))).toEqual([
      " count",
      "-------",
      "    40",
      "(1 row)",
    ]);
  }, 30_000);

  it("stops at the first error and points at it", async () => {
    const r = await run("SELECT 1;\n\nSELECT *\nFROM custmers;\nSELECT 2;");
    expect(r.error).toEqual({
      name: "ERROR",
      message: 'relation "custmers" does not exist',
      line: 4,
    });
    expect(texts(r).slice(-3)).toEqual([
      'ERROR:  relation "custmers" does not exist',
      "LINE 4: FROM custmers;",
      "             ^",
    ]);
  }, 30_000);

  it("shows notices", async () => {
    const r = await run("DO $$ BEGIN RAISE NOTICE 'hi %', 42; END $$");
    expect(texts(r)).toEqual(["NOTICE:  hi 42", "DO"]);
  }, 30_000);

  it("runs checks with the results, more queries and reruns", async () => {
    const r = await run(
      "SELECT name, price FROM products WHERE category = 'tea' ORDER BY price DESC;",
      [
        { name: "rows", check: "rows.length === 3 && rows[0].price === 14" },
        { name: "columns", check: "columns.join() === 'name,price'" },
        {
          name: "query",
          check:
            "(await query('SELECT count(*) AS n FROM products'))[0].n === 15",
        },
        {
          name: "rerun",
          check:
            "(await rerun(\"INSERT INTO products (name, category, price) VALUES ('Gold Tea', 'tea', 99)\")).length === 4",
        },
        {
          name: "dates stay text",
          check:
            "(await query('SELECT joined_on FROM customers WHERE id = 1'))[0].joined_on === '2024-01-15'",
        },
        { name: "fails", check: "rows.length === 99" },
        { name: "throws", check: "(await query('SELECT nope'))" },
      ],
    );
    expect(r.tests?.map((t) => t.passed)).toEqual([
      true,
      true,
      true,
      true,
      true,
      false,
      false,
    ]);
    expect(r.tests?.[6].error).toBe('ERROR: column "nope" does not exist');
  }, 30_000);

  it("fails every check when the code has an error", async () => {
    const r = await run("SELEC 1", [{ name: "x", check: "true" }]);
    expect(r.tests).toEqual([
      { name: "x", passed: false, error: "Fix the error in your code first." },
    ]);
  }, 30_000);
});
