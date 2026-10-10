import { describe, expect, it } from "vitest";

import { chooseCode, isValidStorageId } from "@/lib/code-sync";

const fresh = { code: null, editedAt: 0 };

describe("chooseCode", () => {
  it("opens the starter with nothing saved anywhere", () => {
    expect(chooseCode(fresh, null)).toEqual({
      code: null,
      upload: false,
      keepLocal: false,
    });
  });

  it("opens the account's copy on a new device", () => {
    expect(chooseCode(fresh, { code: "print(1)", editedAt: 100 })).toEqual({
      code: "print(1)",
      upload: false,
      keepLocal: true,
    });
  });

  it("uploads code written before signing in", () => {
    expect(chooseCode({ code: "x = 1", editedAt: 50 }, null)).toEqual({
      code: "x = 1",
      upload: true,
      keepLocal: false,
    });
  });

  it("keeps whichever copy was edited last", () => {
    const older = { code: "old", editedAt: 100 };
    const newer = { code: "new", editedAt: 200 };
    expect(chooseCode(newer, older)).toMatchObject({
      code: "new",
      upload: true,
    });
    expect(chooseCode(older, newer)).toMatchObject({
      code: "new",
      keepLocal: true,
    });
  });

  it("treats a reset like an edit, so it reaches other devices too", () => {
    expect(
      chooseCode({ code: null, editedAt: 300 }, { code: "old", editedAt: 100 }),
    ).toEqual({ code: null, upload: true, keepLocal: false });
    expect(
      chooseCode({ code: "old", editedAt: 100 }, { code: null, editedAt: 300 }),
    ).toEqual({ code: null, upload: false, keepLocal: true });
  });

  it("does nothing when both copies match, or the account is unreachable", () => {
    const same = { code: "same", editedAt: 100 };
    expect(chooseCode(same, { ...same })).toEqual({
      code: "same",
      upload: false,
      keepLocal: false,
    });
    expect(chooseCode(same, undefined)).toEqual({
      code: "same",
      upload: false,
      keepLocal: false,
    });
  });
});

describe("isValidStorageId", () => {
  it("accepts exercise and playground editors only", () => {
    expect(isValidStorageId("exercise-1")).toBe(true);
    expect(isValidStorageId("exercise-12")).toBe(true);
    expect(isValidStorageId("playground-python")).toBe(true);
    expect(isValidStorageId("exercise-01")).toBe(false);
    expect(isValidStorageId("quiz-1")).toBe(false);
    expect(isValidStorageId("../x")).toBe(false);
  });
});
