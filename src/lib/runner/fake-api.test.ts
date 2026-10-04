import { describe, expect, it } from "vitest";

import { createFakeApi, FAKE_API_ORIGIN } from "./fake-api";
import { pythonWorkerSource } from "./python-worker-source";

const get = (api: ReturnType<typeof createFakeApi>, path: string) =>
  api.handle({ method: "GET", url: FAKE_API_ORIGIN + path, headers: {} });

describe("practice API", () => {
  it("works from its source text alone, as the Python worker uses it", () => {
    // Only globals are in scope here, not the module's other names.
    // (__name: a helper the test transform may add for function names.)
    const factory = new Function(
      "__name",
      `return (${createFakeApi.toString()});`,
    )((target: unknown) => target) as typeof createFakeApi;
    const api = factory();
    for (const path of [
      "/",
      "/movies?page=2",
      "/weather?city=Tokyo&days=3",
      "/recipes?tag=vegan",
      "/posts?userId=1",
      "/todos",
      "/shop?category=kids",
      "/shop/4",
      "/robots.txt",
    ]) {
      expect(get(api, path).status, path).toBe(200);
    }
    expect(pythonWorkerSource()).toContain("const createFakeApi = function");
  });

  it("serves the Panda Books shop as HTML pages", () => {
    const api = createFakeApi();
    const first = get(api, "/shop");
    expect(first.headers["content-type"]).toBe("text/html; charset=utf-8");
    expect(first.body).toContain(
      '<p class="results">Showing 1–6 of 18 books</p>',
    );
    expect(first.body).toContain(
      '<a rel="next" href="/shop?page=2">Next →</a>',
    );
    expect(first.body?.match(/<li class="book"/g)).toHaveLength(6);

    const last = get(api, "/shop?page=3");
    expect(last.body).toContain('<a rel="prev" href="/shop?page=2">');
    expect(last.body).not.toContain('rel="next"');

    const kids = get(api, "/shop?category=kids");
    expect(kids.body).toContain("Showing 1–4 of 4 books");

    const book = get(api, "/shop/4");
    expect(book.body).toContain('<article class="book-detail" data-id="4">');
    expect(book.body).toContain("<h3>Reviews (3)</h3>");

    expect(get(api, "/shop?page=4").status).toBe(404);
    expect(get(api, "/shop/99").status).toBe(404);
  });

  it("escapes text in HTML pages", () => {
    const body = get(createFakeApi(), "/shop/8").body ?? "";
    expect(body).toContain("Dragons Can't Dance");
    expect(body).not.toMatch(/<p>[^<]*[<>][^<]*<\/p>/);
  });

  it("has a robots.txt for scrapers", () => {
    const robots = get(createFakeApi(), "/robots.txt");
    expect(robots.headers["content-type"]).toBe("text/plain; charset=utf-8");
    expect(robots.body).toContain("Disallow: /todos");
  });
});
