import { describe, expect, it } from "vitest";

import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows `limit` calls per window for each key", () => {
    const allow = createRateLimiter(3, 1000);
    expect([0, 10, 20, 30].map((t) => allow("mei", t))).toEqual([
      true,
      true,
      true,
      false,
    ]);
    expect(allow("bo", 30)).toBe(true); // others aren't affected
    expect(allow("mei", 999)).toBe(false);
    expect(allow("mei", 1001)).toBe(true); // the first call has expired
  });
});
