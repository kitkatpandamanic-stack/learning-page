import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { parseCatalog, type Catalog } from "@/lib/library-items";

// The route's server-only neighbours, replaced so it runs without a database
// or a bucket.
const state = vi.hoisted(() => ({
  session: null as unknown,
  catalog: null as Catalog | null,
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/session", () => ({ getSession: async () => state.session }));
const recordSecurityEvent = vi.hoisted(() => vi.fn());
vi.mock("@/lib/security-events", () => ({ recordSecurityEvent }));
vi.mock("@/lib/library", () => ({
  getCatalog: async () => state.catalog,
  signedFileUrl: async (file: string) =>
    `https://bucket.example/${file}?X-Amz-Expires=300`,
}));

const { GET } = await import("@/app/api/library/[...path]/route");

const open = async (path: string, from?: string) => {
  const url = new URL(`http://localhost:3000/api/library/${path}`);
  if (from) url.searchParams.set("from", from);
  return GET(new NextRequest(url), {
    params: Promise.resolve({ path: path.split("/") }),
  });
};

const book = "courses/python/books/automate.pdf";

describe("GET /api/library/[...path]", () => {
  beforeEach(() => {
    state.session = { user: { id: "u1" } };
    state.catalog = parseCatalog({
      courses: [
        {
          slug: "python",
          items: [{ id: "a", title: "A", type: "book", file: book }],
        },
      ],
    });
  });

  it("sends guests to sign in, in the page's language, and back", async () => {
    state.session = null;
    const ru = await open(book, "/ru/languages/python");
    expect(ru.status).toBe(307);
    const to = new URL(ru.headers.get("location")!);
    expect(to.pathname).toBe("/ru/sign-in");
    expect(to.searchParams.get("next")).toBe("/languages/python");
    expect(to.searchParams.get("reason")).toBe("library");

    const en = new URL(
      (await open(book, "/languages/go")).headers.get("location")!,
    );
    expect(en.pathname).toBe("/sign-in");
    expect(en.searchParams.get("next")).toBe("/languages/go");

    const evil = new URL(
      (await open(book, "//evil.example/x")).headers.get("location")!,
    );
    expect(evil.origin).toBe("http://localhost:3000");
    expect(evil.searchParams.get("next")).toBe("/languages");
  });

  it("redirects signed-in learners to a link that expires", async () => {
    const res = await open(book);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      `https://bucket.example/${book}?X-Amz-Expires=300`,
    );
    expect(res.headers.get("cache-control")).toBe("private, no-store");
  });

  it("only opens files listed in the catalog", async () => {
    expect((await open("courses/python/books/other.pdf")).status).toBe(404);
    expect((await open("catalog.json")).status).toBe(404);
  });

  it("limits how many files one learner opens, and logs refusals", async () => {
    state.session = { user: { id: "hoarder" } };
    for (let i = 0; i < 30; i++) expect((await open(book)).status).toBe(307);
    const refused = await open(book);
    expect(refused.status).toBe(429);
    expect(refused.headers.get("retry-after")).toBe("600");
    expect(recordSecurityEvent).toHaveBeenCalledWith(
      "rate-limited",
      "library",
      "u:hoarder",
    );
    // Others keep their own allowance.
    state.session = { user: { id: "reader" } };
    expect((await open(book)).status).toBe(307);
  });

  it("says coming soon while storage isn't set up", async () => {
    state.catalog = null;
    expect((await open(book)).status).toBe(503);
  });
});
