import { describe, expect, it } from "vitest";

import { guestDestination, signInError, signInReason } from "@/lib/sign-in";

const titles: Record<string, string> = {
  "/learn/python/for-loops": "The for Loop",
  "/practice/sql/bargains-in-stock": "Bargains in stock",
};
const titleOf = (path: string) => titles[path];

describe("signInReason", () => {
  it("names the page being saved or worked on", () => {
    expect(signInReason("/learn/python/for-loops", "save", titleOf)).toEqual({
      key: "save",
      title: "The for Loop",
    });
    expect(
      signInReason(
        "/practice/sql/bargains-in-stock#exercise-1",
        undefined,
        titleOf,
      ),
    ).toEqual({ key: "page", title: "Bargains in stock" });
  });

  it("explains account pages and practice lists", () => {
    expect(signInReason("/review", undefined, titleOf)).toEqual({
      key: "review",
    });
    expect(signInReason("/saved", undefined, titleOf)).toEqual({
      key: "saved",
    });
    expect(signInReason("/profile", undefined, titleOf)).toEqual({
      key: "dashboard",
    });
    expect(signInReason("/practice/sql", undefined, titleOf)).toEqual({
      key: "practice",
    });
  });

  it("falls back to the general welcome elsewhere", () => {
    expect(signInReason("/", undefined, titleOf)).toBeNull();
    expect(signInReason("/languages/python", "save", titleOf)).toBeNull();
  });
});

describe("signInError", () => {
  it("groups Better Auth's codes into actionable messages", () => {
    expect(signInError("access_denied")).toBe("cancelled");
    expect(signInError("account not linked")).toBe("linked");
    expect(signInError("account_already_linked_to_different_user")).toBe(
      "linked",
    );
    expect(signInError("email_not_found")).toBe("noEmail");
    expect(signInError("state_mismatch")).toBe("expired");
    expect(signInError("something_new")).toBe("other");
    expect(signInError(undefined)).toBeNull();
  });
});

describe("guestDestination", () => {
  it("returns to lessons, but not to pages that need an account", () => {
    expect(guestDestination("/learn/python/for-loops")).toBe(
      "/learn/python/for-loops",
    );
    expect(guestDestination("/dashboard")).toBe("/languages");
    expect(guestDestination("/review?x=1")).toBe("/languages");
  });
});
