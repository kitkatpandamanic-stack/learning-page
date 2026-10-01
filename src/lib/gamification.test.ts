import { describe, expect, it } from "vitest";

import {
  achievements,
  computeStreaks,
  levelFromXp,
  xpForLevel,
} from "./gamification";

describe("levels", () => {
  it("uses growing thresholds", () => {
    expect([1, 2, 3, 4, 5].map(xpForLevel)).toEqual([0, 100, 300, 600, 1000]);
  });

  it("computes level and progress from XP", () => {
    expect(levelFromXp(0)).toEqual({
      level: 1,
      current: 0,
      span: 100,
      toNext: 100,
    });
    expect(levelFromXp(99).level).toBe(1);
    expect(levelFromXp(100)).toEqual({
      level: 2,
      current: 0,
      span: 200,
      toNext: 200,
    });
    expect(levelFromXp(450)).toMatchObject({
      level: 3,
      current: 150,
      toNext: 150,
    });
  });
});

describe("streaks", () => {
  const today = "2026-10-10";

  it("is zero with no activity", () => {
    expect(computeStreaks([], today)).toEqual({
      current: 0,
      longest: 0,
      activeToday: false,
    });
  });

  it("counts consecutive days ending today", () => {
    const r = computeStreaks(["2026-10-08", "2026-10-09", "2026-10-10"], today);
    expect(r).toMatchObject({ current: 3, longest: 3, activeToday: true });
  });

  it("keeps yesterday's streak alive until today ends", () => {
    const r = computeStreaks(["2026-10-08", "2026-10-09"], today);
    expect(r).toMatchObject({ current: 2, activeToday: false });
  });

  it("breaks after a missed day but remembers the longest run", () => {
    const r = computeStreaks(
      ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-10-08"],
      today,
    );
    expect(r).toMatchObject({ current: 0, longest: 4 });
  });

  it("crosses month boundaries", () => {
    const r = computeStreaks(["2026-09-30", "2026-10-01"], "2026-10-01");
    expect(r.current).toBe(2);
  });
});

describe("achievements", () => {
  it("have unique ids", () => {
    const ids = achievements.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("unlock from stats", () => {
    const stats = {
      totalXp: 120,
      lessonsCompleted: 1,
      exercisesSolved: 0,
      quizzesAced: 0,
      currentStreak: 3,
      modulesCompleted: 0,
      levelsCompleted: 0,
    };
    const unlocked = achievements
      .filter((a) => a.unlocked(stats))
      .map((a) => a.id);
    expect(unlocked).toEqual(["first-lesson", "streak-3", "xp-100"]);
  });
});
