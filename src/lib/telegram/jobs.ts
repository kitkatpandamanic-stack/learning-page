import "server-only";

import { and, desc, eq, gte, isNull, lt, ne, or, sql, sum } from "drizzle-orm";

import { db } from "@/db";
import { addDays } from "@/lib/daily";
import { telegramJobRun, telegramLink, user, xpEvent } from "@/db/schema";
import { localizedPath, type Locale } from "@/lib/i18n";
import { getDailySummary } from "@/lib/learning";
import { getStreakStatus } from "@/lib/progress";
import { siteUrl } from "@/lib/site";
import {
  BOT_USERNAME,
  CHANNEL,
  CHANNEL_TIME_ZONE,
  sendMessage,
  telegram,
  TelegramError,
} from "@/lib/telegram/api";
import { dailyPost } from "@/lib/telegram/daily-post";
import { setLinkOption } from "@/lib/telegram/links";
import { forgetUnansweredQuizzes } from "@/lib/telegram/quiz";
import { forgetOldDuels } from "@/lib/tg-app/duel";
import { forgetOldSnippets } from "@/lib/tg-app/snippet";
import {
  forgetEmptyGroups,
  leagueParam,
  leagueTable,
  setWeeklyPost,
  weekOf,
  weeklyGroups,
} from "@/lib/tg-app/league";
import {
  dayIn,
  displayName,
  hoursUntilMidnight,
  leaderboardText,
  leagueButton,
  leagueWeeklyText,
  localHour,
  reminderKeyboard,
  reminderText,
} from "@/lib/telegram/texts";

/**
 * A reminder goes out at the hour the learner picked (8 pm by default) or,
 * when a scheduler run was skipped, up to two hours later; never after
 * 11 pm, when the day is nearly over.
 */
export function reminderDue(hour: number, chosen: number) {
  return hour >= chosen && hour <= Math.min(chosen + 2, 23);
}

/** When the channel's daily post and the Monday leaderboard go out (Tashkent). */
export const DAILY_POST_HOUR = 11;
export const LEADERBOARD_HOUR = 12;
const LEADERBOARD_SIZE = 10;

/**
 * Runs every hour: learners who asked for reminders, whose reminder hour it
 * is now, who aren't on a pause, have a streak going and haven't practised
 * yet today, get one message a day.
 */
export async function sendReminders(now = new Date()) {
  const links = await db
    .select()
    .from(telegramLink)
    .where(eq(telegramLink.reminders, true));
  let sent = 0;
  for (const link of links) {
    const hour = localHour(link.timeZone, now);
    if (!reminderDue(hour, link.reminderHour)) continue;
    const today = dayIn(link.timeZone, now);
    if (link.lastReminded === today) continue;
    if (link.remindersResumeOn && today < link.remindersResumeOn) continue;
    const locale = link.locale as Locale;
    const status = await getStreakStatus(link.userId, link.timeZone);
    const { current, longest, activeToday } = status.streak;
    if (activeToday || current === 0) continue;

    // Claim today's reminder before sending, so two schedulers running at
    // the same time send it once.
    const claimed = await db
      .update(telegramLink)
      .set({ lastReminded: today })
      .where(
        and(
          eq(telegramLink.userId, link.userId),
          or(
            isNull(telegramLink.lastReminded),
            ne(telegramLink.lastReminded, today),
          ),
        ),
      )
      .returning({ userId: telegramLink.userId });
    if (claimed.length === 0) continue;

    const daily = await getDailySummary(link.userId, link.timeZone, locale);
    const url = `${siteUrl}${localizedPath(daily.problem?.permalink ?? "/practice", locale)}`;
    try {
      await sendMessage(
        link.telegramId,
        reminderText(locale, {
          streak: current,
          best: longest,
          freezes: status.freezes,
          hoursLeft: hoursUntilMidnight(link.timeZone, now),
          url,
        }),
        { reply_markup: reminderKeyboard(locale, url) },
      );
      sent++;
    } catch (error) {
      // Not sent: give the day back, so a later run can try again.
      await db
        .update(telegramLink)
        .set({ lastReminded: link.lastReminded })
        .where(eq(telegramLink.userId, link.userId));
      // 403: the learner blocked the bot. Stop trying instead of failing daily.
      if (error instanceof TelegramError && error.code === 403) {
        await setLinkOption(link.userId, "reminders", false);
        continue;
      }
      throw error;
    }
  }
  return { checked: links.length, sent };
}

/**
 * Runs `job` once per channel day however many schedulers call it: the
 * first caller claims the day; a failure (or nothing to post) gives it back.
 */
async function once<T extends { posted: boolean }>(
  job: string,
  day: string,
  run: () => Promise<T>,
): Promise<T | { posted: false; already: true }> {
  const claimed = await db
    .insert(telegramJobRun)
    .values({ job, day })
    .onConflictDoNothing()
    .returning({ job: telegramJobRun.job });
  if (claimed.length === 0) return { posted: false, already: true };
  const release = () =>
    db
      .delete(telegramJobRun)
      .where(and(eq(telegramJobRun.job, job), eq(telegramJobRun.day, day)));
  try {
    const result = await run();
    if (!result.posted) await release();
    return result;
  } catch (error) {
    await release();
    throw error;
  }
}

/**
 * The channel's daily post: the picture of the problems of the day with hint
 * buttons, then the quiz question as polls. Once a day.
 */
export function postDaily(now = new Date()) {
  const day = dayIn(CHANNEL_TIME_ZONE, now);
  return once("daily-post", day, async () => {
    const post = dailyPost(day, "both");
    await telegram("sendPhoto", {
      chat_id: CHANNEL,
      photo: post.photo,
      caption: post.caption,
      parse_mode: "HTML",
      reply_markup: post.reply_markup,
    });
    // The picture is out: a failed poll must not post the day twice.
    let polls = 0;
    for (const poll of post.polls) {
      try {
        await telegram("sendPoll", { chat_id: CHANNEL, ...poll });
        polls++;
      } catch (error) {
        console.error("daily poll failed", error);
      }
    }
    return { posted: true, polls };
  });
}

/** The Monday leaderboard, once however many schedulers ask for it. */
export function postLeaderboardOnce(now = new Date()) {
  return once("leaderboard", dayIn(CHANNEL_TIME_ZONE, now), () =>
    postLeaderboard(now),
  );
}

/**
 * Mondays: last week's table in each group with a league (unless an admin
 * turned the post off), once per group. Groups where nobody earned XP get
 * no post; a group that removed the bot stops getting tried.
 */
export async function postLeagues(now = new Date()) {
  const monday = addDays(weekOf(now), -7);
  const day = dayIn(CHANNEL_TIME_ZONE, now);
  let posted = 0;
  for (const group of await weeklyGroups()) {
    try {
      const result = await once(`league:${group.chatId}`, day, async () => {
        const rows = (await leagueTable(group.chatId, monday)).filter(
          (r) => r.xp > 0,
        );
        if (rows.length === 0) return { posted: false };
        await sendMessage(
          group.chatId,
          leagueWeeklyText(group.title, rows.slice(0, 10), {
            from: monday,
            to: addDays(monday, 6),
          }),
          {
            reply_markup: leagueButton(
              "both",
              `https://t.me/${BOT_USERNAME}?startapp=${leagueParam(group.chatId)}`,
            ),
          },
        );
        return { posted: true };
      });
      if (result.posted) posted++;
    } catch (error) {
      // Removed from the group (403), or the group is gone (400).
      if (
        error instanceof TelegramError &&
        (error.code === 403 || error.code === 400)
      ) {
        await setWeeklyPost(group.chatId, false);
        continue;
      }
      console.error("league post failed", error);
    }
  }
  return { posted };
}

/**
 * The tick (GitHub Actions, twice an hour; telegram-bot.yml):
 * reminders that are due, the daily post from 11:00 Tashkent, the
 * leaderboard on Mondays from 12:00. Each job runs on its own, so one
 * failing doesn't stop the others.
 */
export async function runTick(now = new Date()) {
  const hour = localHour(CHANNEL_TIME_ZONE, now);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: CHANNEL_TIME_ZONE,
    weekday: "short",
  }).format(now);
  const jobs: [string, () => Promise<unknown>][] = [
    ["reminders", () => sendReminders(now)],
  ];
  if (hour >= DAILY_POST_HOUR) jobs.push(["daily-post", () => postDaily(now)]);
  if (weekday === "Mon" && hour >= LEADERBOARD_HOUR) {
    jobs.push(["leaderboard", () => postLeaderboardOnce(now)]);
    jobs.push(["leagues", () => postLeagues(now)]);
  }
  jobs.push([
    "cleanup",
    async () => {
      await forgetUnansweredQuizzes(now);
      await forgetOldDuels(now);
      await forgetOldSnippets(now);
      await forgetEmptyGroups(now);
    },
  ]);

  const results: Record<string, unknown> = {};
  let failed = false;
  for (const [name, run] of jobs) {
    try {
      results[name] = (await run()) ?? "ok";
    } catch (error) {
      console.error(`telegram ${name} failed`, error);
      // Details stay in the logs; the scheduler only needs to know it failed.
      results[name] = "failed";
      failed = true;
    }
  }
  return { ok: !failed, results };
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
