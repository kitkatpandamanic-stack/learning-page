"use server";

import { getAllLessons } from "@/lib/content";
import {
  EXERCISE_XP,
  levelFromXp,
  QUIZ_XP,
  type AchievementInfo,
} from "@/lib/gamification";
import {
  awardXp,
  evaluateAchievements,
  getTimeZone,
  markLessonComplete,
} from "@/lib/progress";
import { getSession } from "@/lib/session";

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
  | { ok: false; reason: "signed-out" | "invalid" };

async function finish(userId: string, xpAwarded: number): Promise<AwardResult> {
  const { stats, newAchievements } = await evaluateAchievements(
    userId,
    await getTimeZone(),
  );
  const level = levelFromXp(stats.totalXp).level;
  return {
    ok: true,
    xpAwarded,
    totalXp: stats.totalXp,
    level,
    leveledUp:
      xpAwarded > 0 && levelFromXp(stats.totalXp - xpAwarded).level < level,
    newAchievements,
  };
}

/** Marks a lesson complete and awards its XP (once). */
export async function completeLesson(
  language: string,
  slug: string,
): Promise<AwardResult> {
  const session = await getSession();
  if (!session) return { ok: false, reason: "signed-out" };

  // XP comes from the content, never from the browser.
  const lesson = getAllLessons().find(
    (l) => l.language === language && l.slug === slug,
  );
  if (!lesson) return { ok: false, reason: "invalid" };

  const userId = session.user.id;
  const awarded = await awardXp(userId, "lesson", lesson.permalink, lesson.xp);
  await markLessonComplete(userId, language, slug);
  return finish(userId, awarded ? lesson.xp : 0);
}

/** Rewards a solved exercise or a quiz answered right on the first try (once each). */
export async function recordActivity(
  permalink: string,
  activityId: string,
): Promise<AwardResult> {
  const session = await getSession();
  if (!session) return { ok: false, reason: "signed-out" };

  const lesson = getAllLessons().find((l) => l.permalink === permalink);
  const match = /^(exercise|quiz)-(\d+)$/.exec(activityId);
  if (!lesson || !match) return { ok: false, reason: "invalid" };

  const kind = match[1] as "exercise" | "quiz";
  const index = Number(match[2]);
  const available =
    kind === "exercise" ? lesson.exerciseCount : lesson.quizCount;
  if (index < 1 || index > available) return { ok: false, reason: "invalid" };

  const userId = session.user.id;
  const amount = kind === "exercise" ? EXERCISE_XP : QUIZ_XP;
  const awarded = await awardXp(
    userId,
    kind,
    `${lesson.permalink}#${activityId}`,
    amount,
  );
  return finish(userId, awarded ? amount : 0);
}
