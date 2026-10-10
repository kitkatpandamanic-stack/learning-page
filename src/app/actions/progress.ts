"use server";

import { getAllLessons } from "@/lib/content";
import { getAllProblems } from "@/lib/practice";
import { EXERCISE_XP, QUIZ_XP, type AchievementInfo } from "@/lib/gamification";
import { awardXp, markLessonComplete, summarizeAward } from "@/lib/progress";
import { createRateLimiter } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

/** A learner finishes a few things a minute; a script trying thousands doesn't get far. */
const allowAward = createRateLimiter(30, 60_000);

export type AwardResult =
  | {
      ok: true;
      /** 0 when this was already rewarded before */
      xpAwarded: number;
      totalXp: number;
      level: number;
      leveledUp: boolean;
      newAchievements: AchievementInfo[];
    }
  | { ok: false; reason: "signed-out" | "invalid" | "rate-limited" };

/** Marks a lesson complete and awards its XP (once). */
export async function completeLesson(
  language: string,
  slug: string,
): Promise<AwardResult> {
  const session = await getSession();
  if (!session) return { ok: false, reason: "signed-out" };
  if (!allowAward(session.user.id))
    return { ok: false, reason: "rate-limited" };

  // XP comes from the content, never from the browser.
  const lesson = getAllLessons().find(
    (l) => l.language === language && l.slug === slug,
  );
  if (!lesson) return { ok: false, reason: "invalid" };

  const userId = session.user.id;
  const awarded = await awardXp(userId, "lesson", lesson.permalink, lesson.xp);
  await markLessonComplete(userId, language, slug);
  return summarizeAward(userId, awarded ? lesson.xp : 0);
}

/** Rewards a solved exercise or a quiz answered right on the first try (once each). */
export async function recordActivity(
  permalink: string,
  activityId: string,
): Promise<AwardResult> {
  const session = await getSession();
  if (!session) return { ok: false, reason: "signed-out" };
  if (!allowAward(session.user.id))
    return { ok: false, reason: "rate-limited" };

  // A lesson's exercises and quizzes, or a practice problem's one exercise.
  const lesson = getAllLessons().find((l) => l.permalink === permalink);
  const problem = lesson
    ? undefined
    : getAllProblems().find((p) => p.permalink === permalink);
  // No leading zeros: "exercise-01" must not count as a second "exercise-1".
  const match = /^(exercise|quiz)-([1-9]\d{0,3})$/.exec(activityId);
  if (!(lesson || problem) || !match) return { ok: false, reason: "invalid" };

  const kind = match[1] as "exercise" | "quiz";
  const index = Number(match[2]);
  const available = problem
    ? kind === "exercise"
      ? problem.exerciseCount
      : 0
    : kind === "exercise"
      ? lesson!.exerciseCount
      : lesson!.quizCount;
  if (index < 1 || index > available) return { ok: false, reason: "invalid" };

  const userId = session.user.id;
  // Problems pay by difficulty, lesson activities a fixed amount.
  const amount = problem
    ? problem.xp
    : kind === "exercise"
      ? EXERCISE_XP
      : QUIZ_XP;
  const awarded = await awardXp(
    userId,
    kind,
    `${permalink}#${kind}-${index}`,
    amount,
  );
  return summarizeAward(userId, awarded ? amount : 0);
}
