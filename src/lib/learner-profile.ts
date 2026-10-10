import "server-only";

import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { learnerProfile } from "@/db/schema";
import { getCourse } from "@/lib/content";
import { isDailyGoal, isStartLevel } from "@/lib/welcome";

export type LearnerProfile = {
  language: string;
  level: number;
  dailyGoal: number;
};

/** The learner's welcome choices, or null if they skipped (or signed up before them). */
export async function getLearnerProfile(
  userId: string,
): Promise<LearnerProfile | null> {
  const [row] = await db
    .select({
      language: learnerProfile.language,
      level: learnerProfile.level,
      dailyGoal: learnerProfile.dailyGoal,
    })
    .from(learnerProfile)
    .where(eq(learnerProfile.userId, userId));
  return row ?? null;
}

/** Saves (or changes) the welcome choices; false when one of them isn't offered. */
export async function saveLearnerProfile(
  userId: string,
  profile: LearnerProfile,
) {
  if (
    !getCourse(profile.language) ||
    !isStartLevel(profile.level) ||
    !isDailyGoal(profile.dailyGoal)
  )
    return false;
  await db
    .insert(learnerProfile)
    .values({ userId, ...profile })
    .onConflictDoUpdate({
      target: learnerProfile.userId,
      set: { ...profile, updatedAt: sql`now()` },
    });
  return true;
}
