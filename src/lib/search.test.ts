import { describe, expect, it } from "vitest";

import {
  normalize,
  prepareIndex,
  search,
  type SearchEntry,
} from "@/lib/search";

const entry = (fields: Partial<SearchEntry>): SearchEntry => ({
  kind: "lesson",
  url: "/learn/python/x",
  title: "",
  description: "",
  language: "python",
  context: "Basics",
  sections: [],
  terms: "",
  ...fields,
});

const index = prepareIndex([
  entry({
    url: "/learn/python/loops",
    title: "Loops",
    description: "Repeat work with for and while.",
    sections: [
      { title: "The for loop", url: "#the-for-loop" },
      { title: "Breaking out early", url: "#breaking-out-early" },
    ],
    terms: "for while range break continue",
  }),
  entry({
    url: "/learn/python/comprehensions",
    title: "Comprehensions",
    description: "Build lists in one line.",
    sections: [{ title: "List comprehensions", url: "#list-comprehensions" }],
    terms: "for in if",
  }),
  entry({
    url: "/learn/sql/outer-joins",
    language: "sql",
    title: "Outer joins",
    description: "Keep rows without a match.",
    terms: "left join null coalesce",
  }),
  entry({
    url: "/learn/javascript/loops",
    language: "javascript",
    title: "Loops",
    description: "for, while and for…of.",
    terms: "for while for…of break",
  }),
  entry({
    kind: "problem",
    url: "/practice/sql/films-per-genre",
    language: "sql",
    title: "Films per genre",
    description: "Count the films in each genre.",
    context: "easy",
    terms: "group by count",
  }),
  entry({
    url: "/learn/python/ru-lesson",
    title: "Циклы и счётчики",
    description: "Повторяем действия.",
  }),
]);

const urls = (query: string, options?: { language?: string }) =>
  search(index, query, options).map(
    (r) => r.entry.url + (r.section?.url ?? ""),
  );

describe("search", () => {
  it("ranks a title match above a passing mention", () => {
    expect(urls("loops")[0]).toMatch(/\/loops$/);
    expect(urls("comprehension")[0]).toBe("/learn/python/comprehensions");
  });

  it("matches word beginnings, and every word must match", () => {
    expect(urls("compreh")).toContain("/learn/python/comprehensions");
    expect(urls("loops genre")).toEqual([]);
  });

  it("finds pages by the code they teach", () => {
    expect(urls("coalesce")).toEqual(["/learn/sql/outer-joins"]);
    expect(urls("group by")).toEqual(["/practice/sql/films-per-genre"]);
  });

  it("points at the section that matches when the title doesn't", () => {
    expect(urls("breaking")).toEqual([
      "/learn/python/loops#breaking-out-early",
    ]);
    expect(urls("list comprehensions")[0]).toBe(
      "/learn/python/comprehensions#list-comprehensions",
    );
    expect(urls("loops")).not.toContain("/learn/python/loops#the-for-loop");
  });

  it("narrows to a language named in the query", () => {
    expect(urls("js loops")).toEqual(["/learn/javascript/loops"]);
    expect(urls("loops", { language: "python" })).toEqual([
      "/learn/python/loops",
    ]);
    expect(urls("sql")).toEqual([]);
  });

  it("ignores case, accents and ё", () => {
    expect(normalize("Ёлка Café")).toBe("елка cafe");
    expect(urls("счетчик")).toEqual(["/learn/python/ru-lesson"]);
    expect(urls("ЦИКЛЫ")).toEqual(["/learn/python/ru-lesson"]);
  });

  it("returns nothing for an empty query", () => {
    expect(urls("   ")).toEqual([]);
  });
});
