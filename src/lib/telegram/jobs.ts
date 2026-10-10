import "server-only";

import { and, desc, eq, gte, lt, sql, sum } from "drizzle-orm";

import { db } from "@/db";
import { telegramLink, user, xpEvent } from "@/db/schema";
import { localizedPath, type Locale } from "@/lib/i18n";
import { getDailySummary } from "@/lib/learning";
import { getStreakStatus } from "@/lib/progress";
import { siteUrl } from "@/lib/site";
import { CHANNEL, sendMessage, TelegramError } from "@/lib/telegram/api";
import { setLinkOption } from "@/lib/telegram/links";
import {
  dayIn,
  displayName,
  leaderboardText,
  localHour,
  reminderText,
} from "@/lib/telegram/texts";

/** Reminders go out at this hour on the learner's clock. */
export const REMINDER_HOUR = 20;
const LEADERBOARD_SIZE = 10;

/**
 * Runs every hour: learners who asked for reminders, whose evening it is now,
 * who have a streak going and haven't practised yet today, get one message.
 */
export async function sendReminders(now = new Date()) {
  const links = await db
    .select()
    .from(telegramLink)
    .where(eq(telegramLink.reminders, true));
  let sent = 0;
  for (const link of links) {
    if (localHour(link.timeZone, now) !== REMINDER_HOUR) continue;
    const today = dayIn(link.timeZone, now);
    if (link.lastReminded === today) continue;
    const locale = link.locale as Locale;
    const status = await getStreakStatus(link.userId, link.timeZone);
    const { current, activeToday } = status.streak;
    if (activeToday || current === 0) continue;

    const daily = await getDailySummary(link.userId, link.timeZone, locale);
    const path = daily.problem?.permalink ?? "/practice";
    try {
      await sendMessage(
        link.telegramId,
        reminderText(locale, {
          streak: current,
          freezes: status.freezes,
          url: `${siteUrl}${localizedPath(path, locale)}`,
        }),
      );
      sent++;
    } catch (error) {
      // 403: the learner blocked the bot. Stop trying instead of failing daily.
      if (error instanceof TelegramError && error.code === 403) {
        await setLinkOption(link.userId, "reminders", false);
        continue;
      }
      throw error;
    }
    await db
      .update(telegramLink)
      .set({ lastReminded: today })
      .where(eq(telegramLink.userId, link.userId));
  }
  return { checked: links.length, sent };
}

/**
 * Runs on Mondays: the last seven days' XP (Monday to Sunday, UTC) of learners
 * who opted in, posted to the channel. Skipped when nobody has XP.
 */
export async function postLeaderboard(now = new Date()) {
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const start = new Date(end.getTime() - 7 * 86_400_000);
  const xp = sum(xpEvent.amount);
  const rows = await db
    .select({ name: user.name, xp })
    .from(xpEvent)
    .innerJoin(
      telegramLink,
      and(
        eq(telegramLink.userId, xpEvent.userId),
        eq(telegramLink.leaderboard, true),
      ),
    )
    .innerJoin(user, eq(user.id, xpEvent.userId))
    .where(and(gte(xpEvent.createdAt, start), lt(xpEvent.createdAt, end)))
    .groupBy(user.id, user.name)
    .having(sql`${xp} > 0`)
    .orderBy(desc(xp))
    .limit(LEADERBOARD_SIZE);
  if (rows.length === 0) return { posted: false, entries: 0 };

  const day = (d: Date) => d.toISOString().slice(0, 10);
  await sendMessage(
    CHANNEL,
    leaderboardText(
      rows.map((r) => ({ name: displayName(r.name), xp: Number(r.xp) })),
      {
        from: day(start),
        to: day(new Date(end.getTime() - 86_400_000)),
        siteUrl,
      },
    ),
  );
  return { posted: true, entries: rows.length };
}
