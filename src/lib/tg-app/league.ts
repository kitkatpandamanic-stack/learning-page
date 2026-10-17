import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { and, count, desc, eq, lt, sql, sum } from "drizzle-orm";

import { db } from "@/db";
import { telegramLink, tgGroup, tgGroupMember, xpEvent } from "@/db/schema";
import { addDays } from "@/lib/daily";
import { blitzDay } from "@/lib/tg-app/blitz";

/** A league's table shows at most this many members. */
const TABLE_SIZE = 50;

// ---------------------------------------------------------------------------
// The group's link: t.me/<bot>?startapp=g_<chat id>_<signature>
// ---------------------------------------------------------------------------

function signature(chatId: number, token: string) {
  return createHmac("sha256", token)
    .update(`league:${chatId}`)
    .digest("base64url")
    .slice(0, 12);
}

/**
 * The start parameter that opens a group's league. Signed with the bot
 * token, so nobody can join a league of a group they only know the id of.
 */
export function leagueParam(
  chatId: number,
  token = process.env.TELEGRAM_BOT_TOKEN,
) {
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return `g_${chatId}_${signature(chatId, token)}`;
}

/** The group a start parameter opens, if its signature is right. */
export function parseLeagueParam(
  param: string | undefined,
  token = process.env.TELEGRAM_BOT_TOKEN,
) {
  const match = /^g_(-?\d{1,20})_([\w-]{12})$/.exec(param ?? "");
  if (!match || !token) return null;
  const chatId = Number(match[1]);
  if (!Number.isSafeInteger(chatId)) return null;
  const expected = Buffer.from(signature(chatId, token));
  const given = Buffer.from(match[2]);
  return expected.length === given.length && timingSafeEqual(expected, given)
    ? chatId
    : null;
}

// ---------------------------------------------------------------------------
// Groups and members
// ---------------------------------------------------------------------------

/** /league in a group: the group gets a league (or its new title). */
export async function registerGroup(chatId: number, title: string) {
  const name = title.trim().slice(0, 64) || "Group";
  await db
    .insert(tgGroup)
    .values({ chatId, title: name })
    .onConflictDoUpdate({ target: tgGroup.chatId, set: { title: name } });
}

export async function setWeeklyPost(chatId: number, weekly: boolean) {
  await db.update(tgGroup).set({ weekly }).where(eq(tgGroup.chatId, chatId));
}

export async function joinLeague(
  chatId: number,
  telegramId: number,
  name: string,
) {
  const [group] = await db
    .select()
    .from(tgGroup)
    .where(eq(tgGroup.chatId, chatId));
  if (!group) return false;
  await db
    .insert(tgGroupMember)
    .values({ chatId, telegramId, name })
    .onConflictDoUpdate({
      target: [tgGroupMember.chatId, tgGroupMember.telegramId],
      set: { name },
    });
  return true;
}

export async function leaveLeague(chatId: number, telegramId: number) {
  await db
    .delete(tgGroupMember)
    .where(
      and(
        eq(tgGroupMember.chatId, chatId),
        eq(tgGroupMember.telegramId, telegramId),
      ),
    );
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

/** Monday of the week (Tashkent) that `now` is in, as a day. */
export function weekOf(now = new Date()) {
  const day = blitzDay(now);
  const weekday = (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7;
  return addDays(day, -weekday);
}

const tashkent = (day: string) => new Date(`${day}T00:00:00+05:00`);

/**
 * A league's table for the week starting `monday`: each member's XP that
 * week (members without a linked account have none yet).
 */
export async function leagueTable(chatId: number, monday: string) {
  const from = tashkent(monday);
  const to = tashkent(addDays(monday, 7));
  const xp = sql<number>`coalesce((
    select ${sum(xpEvent.amount)} from ${xpEvent}
    where ${xpEvent.userId} = ${telegramLink.userId}
      and ${xpEvent.createdAt} >= ${from}
      and ${xpEvent.createdAt} < ${to}
  ), 0)`;
  const rows = await db
    .select({
      telegramId: tgGroupMember.telegramId,
      name: tgGroupMember.name,
      linked: sql<boolean>`${telegramLink.userId} is not null`,
      xp,
    })
    .from(tgGroupMember)
    .leftJoin(
      telegramLink,
      eq(telegramLink.telegramId, tgGroupMember.telegramId),
    )
    .where(eq(tgGroupMember.chatId, chatId))
    .orderBy(desc(xp), tgGroupMember.joinedAt)
    .limit(TABLE_SIZE);
  return rows.map((r) => ({ ...r, xp: Number(r.xp) }));
}

/** The leagues a person is in, with this week's table of each. */
export async function myLeagues(telegramId: number, now = new Date()) {
  const groups = await db
    .select({ chatId: tgGroup.chatId, title: tgGroup.title })
    .from(tgGroupMember)
    .innerJoin(tgGroup, eq(tgGroup.chatId, tgGroupMember.chatId))
    .where(eq(tgGroupMember.telegramId, telegramId))
    .orderBy(tgGroupMember.joinedAt);
  const monday = weekOf(now);
  return Promise.all(
    groups.map(async (g) => ({
      chatId: g.chatId,
      title: g.title,
      week: monday,
      table: (await leagueTable(g.chatId, monday)).map(
        ({ telegramId: id, ...row }) => ({ ...row, you: id === telegramId }),
      ),
    })),
  );
}

/** What someone who opened a group's link sees before joining. */
export async function leagueInvite(chatId: number, telegramId: number) {
  const [group] = await db
    .select()
    .from(tgGroup)
    .where(eq(tgGroup.chatId, chatId));
  if (!group) return null;
  const [[{ members }], [mine]] = await Promise.all([
    db
      .select({ members: count() })
      .from(tgGroupMember)
      .where(eq(tgGroupMember.chatId, chatId)),
    db
      .select({ chatId: tgGroupMember.chatId })
      .from(tgGroupMember)
      .where(
        and(
          eq(tgGroupMember.chatId, chatId),
          eq(tgGroupMember.telegramId, telegramId),
        ),
      ),
  ]);
  return { chatId, title: group.title, members, joined: Boolean(mine) };
}

/** Groups that want the Monday post. */
export async function weeklyGroups() {
  return db
    .select({ chatId: tgGroup.chatId, title: tgGroup.title })
    .from(tgGroup)
    .where(eq(tgGroup.weekly, true));
}

/** Groups a month quiet with no members left are dropped. */
export async function forgetEmptyGroups(now = new Date()) {
  await db
    .delete(tgGroup)
    .where(
      and(
        lt(tgGroup.createdAt, new Date(now.getTime() - 30 * 86_400_000)),
        sql`not exists (select 1 from ${tgGroupMember} m where m.chat_id = ${tgGroup.chatId})`,
      ),
    );
}
