import { describe, expect, it } from "vitest";

import {
  addDays,
  NEW_CARDS_PER_DAY,
  nextReview,
  planSession,
  REVIEW_INTERVALS,
} from "@/lib/review-schedule";

describe("nextReview", () => {
  it("spaces right answers further apart, box by box", () => {
    const today = "2026-10-10";
    let box = 0;
    const gaps: number[] = [];
    for (let i = 0; i < REVIEW_INTERVALS.length + 2; i++) {
      const next = nextReview(box, true, today);
      gaps.push(
        (Date.parse(next.dueOn) - Date.parse(today)) / (24 * 60 * 60 * 1000),
      );
      box = next.box;
    }
    expect(gaps).toEqual([...REVIEW_INTERVALS, 60, 60]);
    expect(box).toBe(REVIEW_INTERVALS.length);
  });

  it("sends a wrong answer back to tomorrow, from any box", () => {
    expect(nextReview(5, false, "2026-12-31")).toEqual({
      box: 0,
      dueOn: "2027-01-01",
    });
  });

  it("adds days across months and leap years", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-10-31", 30)).toBe("2026-11-30");
  });
});

describe("planSession", () => {
  const today = "2026-10-10";

  it("puts due questions first, oldest and shakiest first, then new ones", () => {
    const plan = planSession({
      cards: [
        { ref: "a", box: 3, dueOn: "2026-10-09" },
        { ref: "b", box: 1, dueOn: "2026-10-09" },
        { ref: "c", box: 2, dueOn: "2026-10-01" },
        { ref: "later", box: 4, dueOn: "2026-10-11" },
      ],
      candidates: ["n1", "n2"],
      newToday: 0,
      today,
    });
    expect(plan.refs).toEqual(["c", "b", "a", "n1", "n2"]);
    expect(plan.waiting).toBe(5);
  });

  it("limits new questions per day, counting ones already seen today", () => {
    const candidates = Array.from({ length: 20 }, (_, i) => `n${i}`);
    expect(
      planSession({ cards: [], candidates, newToday: 0, today }).refs,
    ).toHaveLength(NEW_CARDS_PER_DAY);
    expect(
      planSession({ cards: [], candidates, newToday: 3, today }).refs,
    ).toEqual(["n0", "n1"]);
    expect(
      planSession({ cards: [], candidates, newToday: 9, today }).refs,
    ).toEqual([]);
  });

  it("caps one sitting but reports everything waiting", () => {
    const cards = Array.from({ length: 14 }, (_, i) => ({
      ref: `d${i}`,
      box: 1,
      dueOn: today,
    }));
    const plan = planSession({ cards, candidates: ["n"], newToday: 0, today });
    expect(plan.refs).toHaveLength(10);
    expect(plan.waiting).toBe(15);
  });
});
