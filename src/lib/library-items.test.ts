import { describe, expect, it } from "vitest";

import {
  catalogHasFile,
  groupLibrary,
  libraryHref,
  parseCatalog,
  type LibraryItem,
} from "@/lib/library-items";

const item = (over: Partial<LibraryItem> & { id: string }): LibraryItem => ({
  title: over.id,
  type: "book",
  file: `courses/python/books/${over.id}.pdf`,
  ...over,
});

describe("groupLibrary", () => {
  const items = [
    item({ id: "senior-en", level: "senior", lang: "en" }),
    item({ id: "beg-en", level: "beginner", lang: "en" }),
    item({ id: "beg-ru", level: "beginner", lang: "ru" }),
    item({ id: "beg-any", level: "beginner" }),
    item({ id: "no-level", lang: "ru" }),
    item({ id: "odd-level", level: "expert", lang: "en" }),
  ];

  it("groups by level in ladder order, levelless items last", () => {
    expect(groupLibrary(items, "en").map((g) => g.level)).toEqual([
      "beginner",
      "senior",
      null,
    ]);
  });

  it("puts the page's language first, then the other, then unmarked", () => {
    const ids = (locale: "en" | "ru") =>
      groupLibrary(items, locale)[0].items.map((i) => i.id);
    expect(ids("en")).toEqual(["beg-en", "beg-ru", "beg-any"]);
    expect(ids("ru")).toEqual(["beg-ru", "beg-en", "beg-any"]);
  });

  it("returns nothing for an empty shelf", () => {
    expect(groupLibrary([], "ru")).toEqual([]);
  });
});

describe("libraryHref", () => {
  it("sends files through the signed-link route, one encoded segment at a time", () => {
    expect(
      libraryHref(item({ id: "a", file: "courses/go/books/Go 101 #2.pdf" })),
    ).toBe("/api/library/courses/go/books/Go%20101%20%232.pdf");
  });

  it("links out only to http(s) addresses", () => {
    const link = (url: string) =>
      libraryHref({ id: "v", title: "v", type: "video", url });
    expect(link("https://youtube.com/watch?v=1")).toBe(
      "https://youtube.com/watch?v=1",
    );
    expect(link("javascript:alert(1)")).toBeNull();
    expect(link("not a url")).toBeNull();
  });
});

describe("parseCatalog", () => {
  it("drops broken entries instead of failing", () => {
    const catalog = parseCatalog({
      courses: [
        {
          slug: "python",
          title: "Python",
          items: [item({ id: "ok" }), { id: "x" }, null],
        },
        { title: "no slug" },
      ],
    });
    expect(catalog.courses).toHaveLength(1);
    expect(catalog.courses[0].items.map((i) => i.id)).toEqual(["ok"]);
    expect(catalog.shared).toEqual([]);
    expect(parseCatalog(null)).toEqual({
      generated: undefined,
      courses: [],
      shared: [],
    });
  });

  it("knows which files may be opened", () => {
    const catalog = parseCatalog({
      courses: [{ slug: "python", items: [item({ id: "a" })] }],
      shared: [item({ id: "s", file: "shared/books/s.pdf" })],
    });
    expect(catalogHasFile(catalog, "courses/python/books/a.pdf")).toBe(true);
    expect(catalogHasFile(catalog, "shared/books/s.pdf")).toBe(true);
    expect(catalogHasFile(catalog, "courses/python/books/../../secret")).toBe(
      false,
    );
  });
});
