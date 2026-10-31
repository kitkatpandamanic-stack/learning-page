import "server-only";

import { randomBytes, randomInt } from "node:crypto";
import {
  and,
  count,
  desc,
  eq,
  gt,
  inArray,
  isNotNull,
  ne,
  sql,
} from "drizzle-orm";

import { db } from "@/db";
import { telegramLink, tgBugHunt, user } from "@/db/schema";
import { awardXp } from "@/lib/progress";
import { BLITZ_LANGUAGES, blitzDay, type Player } from "@/lib/tg-app/blitz";
import { bugHuntSnippets } from "@/lib/tg-app/bug-hunt";
import { displayName } from "@/lib/telegram/texts";

/** Seconds in a round, and slack for a slow network. */
export const BUGHUNT_SECONDS = 60;
const GRACE_MS = 3000;
/** The day's first finished round pays this per right answer, up to the cap. */
export const BUGHUNT_XP_CAP = 15;
/** Rounds one person can start in a day (plenty for play, not for a script). */
const ROUNDS_PER_DAY = 50;

type Round = typeof tgBugHunt.$inferSelect;

/** A card by its id, "<language>:<number>". */
function card(id: string) {
  const [language, n] = id.split(":");
  return bugHuntSnippets[language]?.[Number(n)] ?? null;
}

async function getRound(player: Player, id: string) {
  if (!/^[\w-]{6,16}$/.test(id)) return null;
  const [round] = await db
    .select()
    .from(tgBugHunt)
    .where(
      and(eq(tgBugHunt.id, id), eq(tgBugHunt.telegramId, player.telegramId)),
    );
  return round ?? null;
}

const deadline = (round: Round) =>
  round.startedAt.getTime() + BUGHUNT_SECONDS * 1000 + GRACE_MS;

async function closeIfExpired(round: Round, now: Date) {
  if (round.finishedAt || now.getTime() <= deadline(round)) return round;
  const [closed] = await db
    .update(tgBugHunt)
    .set({
      finishedAt: new Date(round.startedAt.getTime() + BUGHUNT_SECONDS * 1000),
    })
    .where(
      and(eq(tgBugHunt.id, round.id), sql`${tgBugHunt.finishedAt} is null`),
    )
    .returning();
  if (closed) return closed;
  // Closed at the same moment by another request: read it back.
  const [again] = await db
    .select()
    .from(tgBugHunt)
    .where(eq(tgBugHunt.id, round.id));
  return again ?? round;
}

/**
 * A new 60-second round in a language: every card of that language in a
 * random order, sent without whether it works.
 */
export async function startBugHunt(
  player: Player,
  language: string,
  now = new Date(),
) {
  const deck = bugHuntSnippets[language];
  if (!BLITZ_LANGUAGES.includes(language) || !deck?.length) return null;
  const day = blitzDay(now);
  const [{ today }] = await db
    .select({ today: count() })
    .from(tgBugHunt)
    .where(
      and(eq(tgBugHunt.telegramId, player.telegramId), eq(tgBugHunt.day, day)),
    );
  if (today >= ROUNDS_PER_DAY) return { limit: true as const };

  const cards = deck.map((_, i) => `${language}:${i}`);
  for (let i = cards.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  const id = randomBytes(8).toString("base64url");
  await db.insert(tgBugHunt).values({
    id,
    telegramId: player.telegramId,
    userId: player.userId,
    day,
    language,
    cards,
    startedAt: now,
  });
  return {
    id,
    language,
    cards: cards.map((c) => ({ code: card(c)!.code })),
    left: BUGHUNT_SECONDS * 1000,
  };
}

/** One swipe ("works" or "has a bug"), in order, graded here. */
export async function answerBugHunt(
  player: Player,
  id: string,
  index: number,
  works: boolean,
  now = new Date(),
) {
  const found = await getRound(player, id);
  if (!found || typeof works !== "boolean") return null;
  const round = await closeIfExpired(found, now);
  if (round.finishedAt) return { counted: false as const, done: true };
  const shown = round.cards[index];
  if (!shown || index !== round.answers.length) return null;

  const truth = card(shown)!.works;
  const ok = works === truth;
  const ms = Math.min(
    now.getTime() - round.startedAt.getTime(),
    BUGHUNT_SECONDS * 1000,
  );
  const last = index + 1 >= round.cards.length;
  const [updated] = await db
    .update(tgBugHunt)
    .set({
      answers: sql`${tgBugHunt.answers} || ${JSON.stringify([{ c: works, ok, ms }])}::jsonb`,
      score: sql`${tgBugHunt.score} + ${ok ? 1 : 0}`,
      finishedAt: last ? now : null,
    })
    .where(
      and(
        eq(tgBugHunt.id, round.id),
        sql`${tgBugHunt.finishedAt} is null`,
        sql`jsonb_array_length(${tgBugHunt.answers}) = ${index}`,
      ),
    )
    .returning();
  if (!updated) return null;
  return { counted: true as const, correct: ok, works: truth, done: last };
}

/** The day's first finished round with a right answer pays, once. */
async function settle(round: Round) {
  if (!round.finishedAt || !round.userId || round.xp > 0 || round.score === 0)
    return 0;
  const amount = Math.min(round.score, BUGHUNT_XP_CAP);
  if (!(await awardXp(round.userId, "bughunt", `bughunt:${round.day}`, amount)))
    return 0;
  await db
    .update(tgBugHunt)
    .set({ xp: amount })
    .where(eq(tgBugHunt.id, round.id));
  round.xp = amount;
  return amount;
}

/** Each player's best finished round today in a language, best first. */
async function todaysBest(day: string, language: string) {
  const best = await db
    .select({
      telegramId: tgBugHunt.telegramId,
      userId: sql<string | null>`max(${tgBugHunt.userId})`,
      score: sql<number>`max(${tgBugHunt.score})`,
    })
    .from(tgBugHunt)
    .where(
      and(
        eq(tgBugHunt.day, day),
        eq(tgBugHunt.language, language),
        isNotNull(tgBugHunt.finishedAt),
      ),
    )
    .groupBy(tgBugHunt.telegramId)
    .orderBy(desc(sql`max(${tgBugHunt.score})`))
    .limit(10);
  // Names only for learners who opted in to rankings.
  const ids = best.flatMap((b) => (b.userId ? [b.userId] : []));
  const named = ids.length
    ? await db
        .select({ userId: user.id, name: user.name })
        .from(user)
        .innerJoin(
          telegramLink,
          and(
            eq(telegramLink.userId, user.id),
            eq(telegramLink.leaderboard, true),
          ),
        )
        .where(inArray(user.id, ids))
    : [];
  const names = new Map(named.map((n) => [n.userId, n.name]));
  return best.map((b) => ({
    telegramId: b.telegramId,
    score: Number(b.score),
    name: b.userId ? (names.get(b.userId) ?? null) : null,
  }));
}

/** A player's best score in a language before this round. */
async function personalBest(
  telegramId: number,
  language: string,
  except: string,
) {
  const [row] = await db
    .select({ best: sql<number | null>`max(${tgBugHunt.score})` })
    .from(tgBugHunt)
    .where(
      and(
        eq(tgBugHunt.telegramId, telegramId),
        eq(tgBugHunt.language, language),
        isNotNull(tgBugHunt.finishedAt),
        ne(tgBugHunt.id, except),
      ),
    );
  return Number(row?.best ?? 0);
}

/**
 * A finished round: the cards with the truth and the explanations, XP,
 * today's top players and the player's best.
 */
export async function bugHuntResult(
  player: Player,
  id: string,
  now = new Date(),
) {
  const found = await getRound(player, id);
  if (!found) return null;
  const round = await closeIfExpired(found, now);
  if (!round.finishedAt) return null;
  const paid = await settle(round);
  const [top, best, [{ ahead }]] = await Promise.all([
    todaysBest(round.day, round.language),
    personalBest(player.telegramId, round.language, round.id),
    db
      .select({ ahead: sql<number>`count(distinct ${tgBugHunt.telegramId})` })
      .from(tgBugHunt)
      .where(
        and(
          eq(tgBugHunt.day, round.day),
          eq(tgBugHunt.language, round.language),
          isNotNull(tgBugHunt.finishedAt),
          gt(tgBugHunt.score, round.score),
        ),
      ),
  ]);
  return {
    id: round.id,
    language: round.language,
    score: round.score,
    answered: round.answers.length,
    review: round.answers.map((a, i) => {
      const c = card(round.cards[i])!;
      return {
        code: c.code,
        works: c.works,
        answer: a.c,
        explanation: c[player.locale],
      };
    }),
    xp: round.xp,
    paid,
    /** The best score before this round (beat it for a record) */
    best,
    rank: Number(ahead) + 1,
    top: top.map((t) => ({
      score: t.score,
      name: t.name ? displayName(t.name) : null,
      you: t.telegramId === player.telegramId,
    })),
  };
}

const numberOrNull = (value: unknown) =>
  value === null || value === undefined ? null : Number(value);

/** Today's and all-time bests per language, and whether XP is still to win today. */
export async function bugHuntOverview(player: Player, now = new Date()) {
  const day = blitzDay(now);
  const rows = await db
    .select({
      language: tgBugHunt.language,
      today: sql<number>`max(case when ${tgBugHunt.day} = ${day} then ${tgBugHunt.score} end)`,
      best: sql<number>`max(${tgBugHunt.score})`,
      paid: sql<number>`max(case when ${tgBugHunt.day} = ${day} then ${tgBugHunt.xp} else 0 end)`,
    })
    .from(tgBugHunt)
    .where(
      and(
        eq(tgBugHunt.telegramId, player.telegramId),
        isNotNull(tgBugHunt.finishedAt),
      ),
    )
    .groupBy(tgBugHunt.language);
  const byLanguage = new Map(rows.map((r) => [r.language, r]));
  return {
    xpLeft: !rows.some((r) => Number(r.paid) > 0),
    languages: BLITZ_LANGUAGES.map((language) => ({
      language,
      cards: bugHuntSnippets[language]?.length ?? 0,
      today: numberOrNull(byLanguage.get(language)?.today),
      best: numberOrNull(byLanguage.get(language)?.best),
    })),
  };
}
