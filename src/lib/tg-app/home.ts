import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { userAchievement } from "@/db/schema";
import { localizedPath } from "@/lib/i18n";
import { getStreakStatus } from "@/lib/progress";
import { siteUrl } from "@/lib/site";
import { BOT_USERNAME } from "@/lib/telegram/api";
import { getQuizStats } from "@/lib/telegram/quiz";
import { blitzOverview } from "@/lib/tg-app/blitz";
import type { MiniAppRequest } from "@/lib/tg-app/player";
import { pandaMood, pandaStage, unlockedOutfits } from "@/lib/tg-app/panda";

/** Everything the Mini App's first screen needs, in one call. */
export async function miniAppHome({
  init,
  link,
  locale,
  player,
}: MiniAppRequest) {
  const blitz = await blitzOverview(player);
  const base = {
    locale,
    firstName: init.user.first_name,
    bot: BOT_USERNAME,
    startParam: init.startParam ?? null,
    profileUrl: `${siteUrl}${localizedPath("/profile", locale)}`,
    blitz,
  };
  if (!link) return { ...base, linked: false as const, panda: null };

  const [status, quiz, achievements] = await Promise.all([
    getStreakStatus(link.userId, link.timeZone),
    getQuizStats(link.userId, link.timeZone),
    db
      .select({ id: userAchievement.achievementId })
      .from(userAchievement)
      .where(eq(userAchievement.userId, link.userId)),
  ]);
  const { current, longest, activeToday } = status.streak;
  return {
    ...base,
    linked: true as const,
    panda: {
      level: status.level,
      totalXp: status.totalXp,
      streak: current,
      best: longest,
      todayXp: status.todayXp,
      dailyGoal: status.dailyGoal,
      freezes: status.freezes,
      quizStreak: quiz.streak,
      stage: pandaStage(status.level),
      mood: pandaMood({
        activeToday,
        streak: current,
        todayXp: status.todayXp,
        dailyGoal: status.dailyGoal,
      }),
      unlocked: unlockedOutfits(achievements.map((a) => a.id)),
    },
  };
}

export type MiniAppHome = Awaited<ReturnType<typeof miniAppHome>>;
