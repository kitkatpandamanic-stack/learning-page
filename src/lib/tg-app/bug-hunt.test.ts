/**
 * Bug Hunt's cards: phone-sized, EN + RU, about half of them working, and
 * every `works` checked by running the snippet the way the site runs code.
 */
import { PGlite } from "@electric-sql/pglite";
import { loadPyodide, type PyodideInterface } from "pyodide";
import { beforeAll, describe, expect, it } from "vitest";

import { compareOutput, execute } from "@/lib/runner/execute";
import { executePython } from "@/lib/runner/execute-python";
import { createSqlSandbox, executeSql } from "@/lib/runner/execute-sql";
import { SQL_SEED } from "@/lib/runner/sql-seed";
import { bugHuntSnippets } from "@/lib/tg-app/bug-hunt";

import { checkTypes } from "../../../tests/node-typecheck";

const LANGUAGES = ["python", "javascript", "typescript", "sql"] as const;
const CYRILLIC = /[а-яё]/i;

/**
 * For each SQL snippet in order: a word from its code (so the list can't
 * drift out of line) and a correct query, written differently, that
 * returns what the snippet's names promise.
 */
const SQL_ANSWERS: [anchor: string, answer: string][] = [
  ["city = NULL", "SELECT name FROM customers WHERE city IS NULL"],
  [
    "COALESCE",
    `SELECT name, CASE WHEN city IS NULL THEN 'unknown' ELSE city END
     FROM customers WHERE country = 'UK'`,
  ],
  [
    "NOT IN",
    `SELECT name FROM employees WHERE id NOT IN
     (SELECT manager_id FROM employees WHERE manager_id IS NOT NULL)`,
  ],
  [
    "NOT EXISTS",
    `SELECT name FROM employees WHERE id NOT IN
     (SELECT manager_id FROM employees WHERE manager_id IS NOT NULL)`,
  ],
  [
    "COUNT(*) AS orders",
    `SELECT name, (SELECT COUNT(*) FROM orders WHERE customer_id = c.id)
     FROM customers c`,
  ],
  [
    "AND o.status",
    `SELECT name, (SELECT COUNT(*) FROM orders
       WHERE customer_id = c.id AND status = 'paid')
     FROM customers c`,
  ],
  [
    "WHERE o.status",
    `SELECT name, (SELECT COUNT(*) FROM orders
       WHERE customer_id = c.id AND status = 'paid')
     FROM customers c`,
  ],
  [
    "HAVING",
    `SELECT * FROM (SELECT category, AVG(price) AS a
     FROM products GROUP BY category) t WHERE a > 10`,
  ],
  [
    "WHERE AVG",
    `SELECT * FROM (SELECT category, AVG(price) AS a
     FROM products GROUP BY category) t WHERE a > 10`,
  ],
  [
    "DISTINCT ON",
    `SELECT category, name, price FROM products p
     WHERE price = (SELECT MAX(price) FROM products
                    WHERE category = p.category)
     ORDER BY category`,
  ],
  [
    "MAX(price)",
    `SELECT category, name, price FROM products p
     WHERE price = (SELECT MAX(price) FROM products
                    WHERE category = p.category)`,
  ],
  ["pct_with_city", "SELECT 90"],
  ["AS share", "SELECT 0.9"],
  [
    ">= '2025-03-01'",
    `SELECT COUNT(*) FROM orders
     WHERE to_char(ordered_at, 'YYYY-MM') = '2025-03'`,
  ],
  [
    "ORDER BY city DESC",
    `SELECT name, city FROM customers WHERE city IS NOT NULL
     ORDER BY city DESC LIMIT 3`,
  ],
  [
    "AS boss",
    `SELECT name,
       (SELECT name FROM employees WHERE id = e.manager_id) AS boss
     FROM employees e`,
  ],
  [
    "BETWEEN",
    `SELECT COUNT(*) FROM orders
     WHERE to_char(ordered_at, 'YYYY-MM') = '2025-03'`,
  ],
  [
    "COUNT(DISTINCT",
    "SELECT COUNT(*) FROM (SELECT DISTINCT customer_id FROM orders) t",
  ],
  [
    "COUNT(customer_id)",
    "SELECT COUNT(*) FROM (SELECT DISTINCT customer_id FROM orders) t",
  ],
  ["LOWER(title)", "SELECT title FROM movies WHERE title ILIKE '%bamboo%'"],
  ["title LIKE", "SELECT title FROM movies WHERE title ILIKE '%bamboo%'"],
  [
    "WITH ranked",
    `SELECT name FROM employees e WHERE 3 > (SELECT COUNT(*)
     FROM employees WHERE salary > e.salary)`,
  ],
  [
    "WHERE pos",
    `SELECT name, (SELECT COUNT(*) + 1 FROM employees
       WHERE salary > e.salary)
     FROM employees e WHERE 3 > (SELECT COUNT(*)
       FROM employees WHERE salary > e.salary)
     ORDER BY salary DESC`,
  ],
  [
    "IN ('tea'",
    `SELECT name FROM products WHERE stock > 0
     AND (category = 'tea' OR category = 'snacks')`,
  ],
  [
    "OR category",
    `SELECT name FROM products WHERE stock > 0
     AND (category = 'tea' OR category = 'snacks')`,
  ],
  [
    "ORDER BY gross",
    `SELECT name, price * 1.2 FROM products
     ORDER BY price DESC LIMIT 3`,
  ],
  [
    "WHERE gross",
    "SELECT name, price * 1.2 FROM products WHERE price * 1.2 > 20",
  ],
];

/** What the comments say the code prints, in order. */
function promisedOutput(code: string, comment: "#" | "//") {
  const marker = ` ${comment} `;
  return code
    .split("\n")
    .filter((line) => line.includes(marker))
    .map((line) => line.slice(line.indexOf(marker) + marker.length));
}

/**
 * Runs JavaScript whose bug may be a Promise nobody catches: that counts as
 * the code crashing, instead of failing the whole test run.
 */
async function runCatchingRejections<T>(run: () => Promise<T>) {
  const vitestListeners = process.listeners("unhandledRejection");
  let rejected = false;
  const record = () => {
    rejected = true;
  };
  process.removeAllListeners("unhandledRejection");
  process.on("unhandledRejection", record);
  try {
    const result = await run();
    // Node reports unhandled rejections once the microtasks are done.
    await new Promise((resolve) => setTimeout(resolve, 10));
    return { result, rejected };
  } finally {
    process.off("unhandledRejection", record);
    for (const listener of vitestListeners) {
      process.on("unhandledRejection", listener);
    }
  }
}

describe("Bug Hunt's cards", () => {
  it("has about 25 cards for each language, and nothing else", () => {
    expect(Object.keys(bugHuntSnippets).sort()).toEqual([...LANGUAGES].sort());
    for (const language of LANGUAGES) {
      const cards = bugHuntSnippets[language];
      expect(cards.length, language).toBeGreaterThanOrEqual(24);
      expect(cards.length, language).toBeLessThanOrEqual(30);
      const working = cards.filter((c) => c.works).length / cards.length;
      expect(working, language).toBeGreaterThanOrEqual(0.4);
      expect(working, language).toBeLessThanOrEqual(0.6);
      expect(new Set(cards.map((c) => c.code)).size, language).toBe(
        cards.length,
      );
    }
  });

  it("fits a phone: 3–8 lines of at most 40 characters", () => {
    for (const language of LANGUAGES) {
      for (const { code } of bugHuntSnippets[language]) {
        const lines = code.split("\n");
        expect(lines.length, code).toBeGreaterThanOrEqual(3);
        expect(lines.length, code).toBeLessThanOrEqual(8);
        for (const line of lines) {
          expect(line.length, line).toBeLessThanOrEqual(40);
          expect(line, code).not.toMatch(/\t|\s$/);
        }
      }
    }
  });

  it("explains every card in English and Russian", () => {
    for (const language of LANGUAGES) {
      for (const { code, en, ru } of bugHuntSnippets[language]) {
        for (const text of [en, ru]) {
          expect(text.length, code).toBeGreaterThan(30);
          expect(text.length, code).toBeLessThanOrEqual(200);
          expect(text, code).toMatch(/[.!?)]$/);
          // One or two sentences.
          expect(text.split(/[.!?] (?=[A-ZА-ЯЁ'])/).length, text).toBeLessThan(
            3,
          );
        }
        expect(CYRILLIC.test(en), en).toBe(false);
        expect(CYRILLIC.test(ru), ru).toBe(true);
      }
    }
  });

  it("says in a comment what each Python, JS and TS line should print", () => {
    for (const language of ["python", "javascript", "typescript"]) {
      const comment = language === "python" ? "#" : "//";
      for (const { code } of bugHuntSnippets[language]) {
        expect(promisedOutput(code, comment).length, code).toBeGreaterThan(0);
      }
    }
  });
});

describe("Bug Hunt's cards really work or really have a bug", () => {
  let pyodide: PyodideInterface;
  beforeAll(async () => {
    pyodide = await loadPyodide();
  }, 120_000);

  for (const [i, card] of bugHuntSnippets.python.entries()) {
    it(`python #${i + 1}`, async () => {
      const result = await executePython(pyodide, card.code);
      const output = compareOutput(
        result.output,
        promisedOutput(card.code, "#").join("\n"),
      );
      expect(!result.error && output.passed, card.code).toBe(card.works);
    });
  }

  for (const language of ["javascript", "typescript"] as const) {
    for (const [i, card] of bugHuntSnippets[language].entries()) {
      it(`${language} #${i + 1}`, async () => {
        const typeErrors =
          language === "typescript" ? checkTypes(card.code) : [];
        const { result, rejected } = await runCatchingRejections(() =>
          execute(card.code, { language }),
        );
        const output = compareOutput(
          result.output,
          promisedOutput(card.code, "//").join("\n"),
        );
        expect(
          !typeErrors.length && !result.error && !rejected && output.passed,
          card.code,
        ).toBe(card.works);
      });
    }
  }

  let freshDatabase: () => Promise<PGlite>;
  beforeAll(async () => {
    freshDatabase = await createSqlSandbox((o) => PGlite.create(o), SQL_SEED);
  }, 60_000);

  it("has a correct answer for every SQL card", () => {
    expect(SQL_ANSWERS.length).toBe(bugHuntSnippets.sql.length);
    for (const [i, [anchor]] of SQL_ANSWERS.entries()) {
      expect(bugHuntSnippets.sql[i].code, anchor).toContain(anchor);
    }
  });

  for (const [i, card] of bugHuntSnippets.sql.entries()) {
    it(`sql #${i + 1}`, async () => {
      const [, answer] = SQL_ANSWERS[i];
      // Rows as lists of values (names can differ); in order only when
      // the card sorts them.
      const sort = /^ORDER BY/m.test(card.code) ? "" : ".sort()";
      const values = (rows: string) =>
        `JSON.stringify(${rows}.map((r) => JSON.stringify(Object.values(r)))${sort})`;
      const db = await freshDatabase();
      try {
        const result = await executeSql(db, card.code, {
          tests: [
            {
              name: "returns what its names promise",
              check: `${values("rows")} === ${values(`(await query(${JSON.stringify(answer)}))`)}`,
            },
          ],
        });
        const passed = !result.error && result.tests?.[0]?.passed === true;
        expect(passed, card.code).toBe(card.works);
      } finally {
        await db.close();
      }
    });
  }
});
