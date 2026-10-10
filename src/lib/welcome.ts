/**
 * The welcome steps a new learner goes through after their first sign-in:
 * a language, a starting level and a daily goal. Shared by the page and the
 * server; no server imports.
 */

/** Daily goals offered, as XP a day (about 10 XP per 3–4 minutes of learning). */
export const DAILY_GOALS = [
  { id: "casual", xp: 30, minutes: 10 },
  { id: "regular", xp: 50, minutes: 20 },
  { id: "serious", xp: 100, minutes: 30 },
] as const;

export type DailyGoalId = (typeof DAILY_GOALS)[number]["id"];

/** Where a learner can start: new to coding, knows the basics, has built things. */
export const START_LEVELS = [0, 1, 2] as const;

export function isDailyGoal(xp: number) {
  return DAILY_GOALS.some((goal) => goal.xp === xp);
}

export function isStartLevel(level: number) {
  return (START_LEVELS as readonly number[]).includes(level);
}
