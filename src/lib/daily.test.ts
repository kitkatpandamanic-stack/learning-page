import { describe, expect, it } from "vitest";

import {
  addDays,
  dailyIndex,
  dailyProblem,
  MAX_FREEZES,
  planFreezes,
} from "@/lib/daily";

describe("problem of the day", () => {
  it("is the same all day and differs between languages", () => {
    expect(dailyIndex("2026-10-10", "sql", 40)).toBe(
      dailyIndex("2026-10-10", "sql", 40),
    );
    const languages = ["python", "javascript", "typescript", "sql"].map((l) =>
      dailyIndex("2026-10-10", l, 40),
    );
    expect(new Set(languages).size).toBeGreaterThan(1);
  });

  it("goes through every problem before repeating one", () => {
    for (const count of [40, 12, 7, 1]) {
      const seen = new Set<number>();
      for (let i = 0; i < count; i++) {
        seen.add(dailyIndex(addDays("2026-10-10", i), "python", count));
      }
      expect(seen.size).toBe(count);
    }
  });

  it("picks from the list it's given", () => {
    const list = ["a", "b", "c"];
    expect(list).toContain(dailyProblem("2026-10-10", "sql", list));
    expect(dailyProblem("2026-10-10", "sql", [])).toBeUndefined();
  });
});

describe("streak freezes", () => {
  const today = "2026-10-10";
  const run = (from: string, days: number) =>
    Array.from({ length: days }, (_, i) => addDays(from, i));

  it("covers yesterday when it was missed, if a freeze is left", () => {
    const active = new Set(run("2026-10-05", 4)); // 5th to 8th, missed the 9th
    expect(planFreezes({ active, today, available: 1 })).toEqual({
      fill: ["2026-10-09"],
      earn: false,
    });
    expect(planFreezes({ active, today, available: 0 }).fill).toEqual([]);
  });

  it("covers a two-day gap only with two freezes", () => {
    const active = new Set(run("2026-10-01", 7)); // up to the 7th
    expect(planFreezes({ active, today, available: 1 }).fill).toEqual([]);
    expect(planFreezes({ active, today, available: 2 }).fill).toEqual([
      "2026-10-09",
      "2026-10-08",
    ]);
  });

  it("needs a streak to save and never covers older gaps", () => {
    expect(
      planFreezes({ active: new Set(), today, available: 2 }).fill,
    ).toEqual([]);
    // Active yesterday and today: an old gap stays a gap.
    const active = new Set(["2026-10-01", ...run("2026-10-09", 2)]);
    expect(planFreezes({ active, today, available: 2 }).fill).toEqual([]);
  });

  it("earns a freeze on every 7th day in a row, up to the limit", () => {
    const week = new Set(run("2026-10-04", 7)); // 4th to 10th = 7 days
    expect(planFreezes({ active: week, today, available: 0 }).earn).toBe(true);
    expect(
      planFreezes({ active: week, today, available: MAX_FREEZES }).earn,
    ).toBe(false);
    const six = new Set(run("2026-10-05", 6));
    expect(planFreezes({ active: six, today, available: 0 }).earn).toBe(false);
  });

  it("covers the gap when the learner comes back, and counts frozen days towards the 7", () => {
    // 4th–7th active, missed the 8th and 9th, back today (10th).
    const active = new Set([...run("2026-10-04", 4), today]);
    expect(planFreezes({ active, today, available: 2 })).toEqual({
      fill: ["2026-10-09", "2026-10-08"],
      earn: true,
    });
  });
});
