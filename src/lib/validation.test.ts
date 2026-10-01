import { describe, expect, it } from "vitest";

import { safeReturnPath } from "./return-path";
import { isValidTimeZone } from "./time-zone";

describe("safeReturnPath", () => {
  it("keeps same-site paths", () => {
    expect(safeReturnPath("/learn/js/x?a=1#b")).toBe("/learn/js/x?a=1#b");
    expect(safeReturnPath("/dashboard")).toBe("/dashboard");
  });

  it.each([
    "//evil.example",
    "/\\evil.example",
    "/\t/evil.example",
    "/\n/evil.example",
    "https://evil.example",
    "evil",
    "",
    undefined,
    ["/a"],
  ])("rejects %j", (value) => {
    expect(safeReturnPath(value)).toBe("/dashboard");
  });
});

describe("isValidTimeZone", () => {
  it.each([
    "UTC",
    "Asia/Kolkata",
    "Europe/Kyiv",
    "America/Argentina/Buenos_Aires",
    "Etc/GMT+5",
  ])("accepts %s", (tz) => expect(isValidTimeZone(tz)).toBe(true));

  it.each(["Mars/Olympus", "", "Europe/London'; drop table", "x".repeat(80)])(
    "rejects %j",
    (tz) => expect(isValidTimeZone(tz)).toBe(false),
  );
});
