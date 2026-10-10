import { describe, expect, it } from "vitest";

import { activityLevel, buildCalendar } from "@/lib/activity";

describe("activity calendar", () => {
  const today = "2026-10-14"; // a Wednesday

  it("lays out weeks Monday first, ending with this week", () => {
    const { columns } = buildCalendar({
      xpByDay: new Map(),
      frozen: [],
      today,
      goal: 50,
      weeks: 4,
    });
    expect(columns).toHaveLength(4);
    expect(columns.every((c) => c.length === 7)).toBe(true);
    expect(columns[0][0]?.date).toBe("2026-09-21"); // a Monday
    const last = columns.at(-1)!;
    expect(last[2]?.date).toBe(today);
    // Thursday to Sunday haven't happened yet.
    expect(last.slice(3)).toEqual([null, null, null, null]);
  });

  it("shades days against the daily goal and marks freezes", () => {
    const { columns } = buildCalendar({
      xpByDay: new Map([
        ["2026-10-12", 10],
        ["2026-10-13", 120],
      ]),
      frozen: ["2026-10-11", "2026-10-13"],
      today,
      goal: 50,
      weeks: 2,
    });
    const days = columns.flat();
    const day = (date: string) => days.find((d) => d?.date === date);
    expect(day("2026-10-12")).toMatchObject({ xp: 10, level: 1 });
    expect(day("2026-10-13")).toMatchObject({ level: 4, frozen: false });
    expect(day("2026-10-11")).toMatchObject({ xp: 0, frozen: true });
    expect(
      [0, 1, 25, 49, 50, 99, 100].map((xp) => activityLevel(xp, 50)),
    ).toEqual([0, 1, 2, 2, 3, 3, 4]);
  });

  it("compares this week with last week and finds the best day", () => {
    const { totals } = buildCalendar({
      xpByDay: new Map([
        [today, 30],
        ["2026-10-08", 20], // 6 days ago: this week
        ["2026-10-07", 15], // 7 days ago: last week
        ["2026-09-30", 90], // 14 days ago: neither, but the best day
      ]),
      frozen: [],
      today,
      goal: 50,
      weeks: 4,
    });
    expect(totals).toMatchObject({
      thisWeek: 50,
      lastWeek: 15,
      activeDays: 4,
      best: { date: "2026-09-30", xp: 90 },
    });
    expect(totals.totalDays).toBe(24); // 3 full weeks + Mon–Wed
  });

  it("labels each month once, above the first week starting in it", () => {
    const { months } = buildCalendar({
      xpByDay: new Map(),
      frozen: [],
      today,
      goal: 50,
      weeks: 10,
    });
    expect(months.map((m) => m.date.slice(0, 7))).toEqual([
      "2026-08",
      "2026-09",
      "2026-10",
    ]);
  });
});
