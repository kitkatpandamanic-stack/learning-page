import "server-only";

import { count, eq, sum } from "drizzle-orm";

import { db } from "@/db";
import { account, lessonProgress, xpEvent } from "@/db/schema";

/** Headline numbers for a learner. Phase 7 adds streaks, charts and achievements. */
export async function getUserStats(userId: string) {
  const [[lessons], [xp]] = await Promise.all([
    db
      .select({ value: count() })
      .from(lessonProgress)
      .where(eq(lessonProgress.userId, userId)),
    db
      .select({ value: sum(xpEvent.amount) })
      .from(xpEvent)
      .where(eq(xpEvent.userId, userId)),
  ]);
  return {
    lessonsCompleted: lessons?.value ?? 0,
    totalXp: Number(xp?.value ?? 0),
  };
}

export async function getLinkedProviders(userId: string) {
  const rows = await db
    .select({ providerId: account.providerId })
    .from(account)
    .where(eq(account.userId, userId));
  return rows.map((r) => r.providerId);
}
