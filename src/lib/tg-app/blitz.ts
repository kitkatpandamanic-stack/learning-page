import "server-only";

import {
  and,
  count,
  desc,
  asc,
  eq,
  isNotNull,
  sql,
  or,
  gt,
  lt,
} from "drizzle-orm";

import { db } from "@/db";
import { telegramLink, tgBlitz, user } from "@/db/schema";
import { getPollQuizzes } from "@/lib/daily-feed";
import { awardXp } from "@/lib/progress";
import { seededRandom } from "@/lib/random";
import { CHANNEL_TIME_ZONE } from "@/lib/telegram/api";
import { dayIn, displayName, type BotLocale } from "@/lib/telegram/texts";

/** Questions in a Blitz, seconds to answer them, and slack for a slow network. */
export const BLITZ_SIZE = 10;
export const BLITZ_SECONDS = 60;
const GRACE_MS = 3000;
/** XP per right answer, paid for the first Blitz finished each day (max 20). */
export const BLITZ_XP = 2;
/** Blitz #1 */
const FIRST_DAY = "2026-10-17";

export const BLITZ_LANGUAGES = ["python", "javascript", "typescript", "sql"];

export type Player = {
  telegramId: number;
  /** null for people who haven't linked a PandaDev account */
  userId: string | null;
  locale: BotLocale;
};

/** Blitz days follow the channel's clock, so everyone shares one set a day. */
export const blitzDay = (now = new Date()) => dayIn(CHANNEL_TIME_ZONE, now);

export function blitzNumber(day: string) {
  return (
    Math.round(
      (Date.parse(`${day}T12:00:00Z`) - Date.parse(`${FIRST_DAY}T12:00:00Z`)) /
        86_400_000,
    ) + 1
  );
}

function seed(text: string) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** The day's questions for a language: the same for everyone, no repeats within a set. */
export function blitzQuestions(day: string, language: string) {
  const pool = getPollQuizzes().filter((q) =>
    q.permalink.startsWith(`/learn/${language}/`),
  );
  const random = seededRandom(seed(`${day}:${language}`));
  const picked = [...pool];
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }
  return picked.slice(0, BLITZ_SIZE);
}

type Row = typeof tgBlitz.$inferSelect;

const key = (player: Player, day: string, language: string) =>
  and(
    eq(tgBlitz.telegramId, player.telegramId),
    eq(tgBlitz.day, day),
    eq(tgBlitz.language, language),
  );

async function getRow(player: Player, day: string, language: string) {
  const [row] = await db
    .select()
    .from(tgBlitz)
    .where(key(player, day, language));
  return row ?? null;
}

const deadline = (row: Row) =>
  row.startedAt.getTime() + BLITZ_SECONDS * 1000 + GRACE_MS;

/** Time's up for a Blitz left half-way: it ends with what was answered. */
async function closeIfExpired(row: Row, now: Date) {
  if (row.finishedAt || now.getTime() <= deadline(row)) return row;
  const [closed] = await db
    .update(tgBlitz)
    .set({
      finishedAt: new Date(row.startedAt.getTime() + BLITZ_SECONDS * 1000),
    })
    .where(
      and(
        eq(tgBlitz.telegramId, row.telegramId),
        eq(tgBlitz.day, row.day),
        eq(tgBlitz.language, row.language),
      ),
    )
    .returning();
  return closed ?? row;
}

/** Questions as the player sees them: no answers. */
function shown(day: string, language: string, locale: BotLocale) {
  return blitzQuestions(day, language).map((q) => ({
    question: q[locale].question,
    options: q[locale].options,
  }));
}

/**
 * Starts today's Blitz in a language, or picks up the one already going.
 * The clock runs on the server from the first call.
 */
export async function startBlitz(
  player: Player,
  language: string,
  now = new Date(),
) {
  if (!BLITZ_LANGUAGES.includes(language)) return null;
  const day = blitzDay(now);
  await db
    .insert(tgBlitz)
    .values({
      telegramId: player.telegramId,
      day,
      language,
      userId: player.userId,
      startedAt: now,
    })
    .onConflictDoNothing();
  const row = await closeIfExpired((await getRow(player, day, language))!, now);
  return {
    day,
    number: blitzNumber(day),
    questions: shown(day, language, player.locale),
    answered: row.answers.length,
    /** Milliseconds left on the clock */
    left: row.finishedAt
      ? 0
      : Math.max(
          0,
          BLITZ_SECONDS * 1000 - (now.getTime() - row.startedAt.getTime()),
        ),
    done: Boolean(row.finishedAt),
  };
}

/**
 * One answer, in order. Graded here, never in the browser; answers after
 * the time is up don't count.
 */
export async function answerBlitz(
  player: Player,
  language: string,
  index: number,
  choice: number,
  now = new Date(),
) {
  const day = blitzDay(now);
  const found = await getRow(player, day, language);
  if (!found) return null;
  const row = await closeIfExpired(found, now);
  if (row.finishedAt) return { counted: false as const, done: true };
  const questions = blitzQuestions(day, language);
  const question = questions[index];
  if (!question || index !== row.answers.length) return null;
  if (!Number.isInteger(choice) || choice < 0) return null;

  const answer = question[player.locale].answer;
  const ok = choice === answer;
  const ms = Math.min(
    now.getTime() - row.startedAt.getTime(),
    BLITZ_SECONDS * 1000,
  );
  const last = index + 1 >= questions.length;
  const [updated] = await db
    .update(tgBlitz)
    .set({
      answers: sql`${tgBlitz.answers} || ${JSON.stringify([{ c: choice, ok, ms }])}::jsonb`,
      score: sql`${tgBlitz.score} + ${ok ? 1 : 0}`,
      ms,
      finishedAt: last ? now : null,
    })
    .where(
      and(
        key(player, day, language),
        sql`${tgBlitz.finishedAt} is null`,
        sql`jsonb_array_length(${tgBlitz.answers}) = ${index}`,
      ),
    )
    .returning();
  // Two taps at once: only the first one counts.
  if (!updated) return null;
  return { counted: true as const, correct: ok, answer, done: last };
}

/**
 * Pays a finished Blitz's XP to a linked learner: only the day's first
 * finished Blitz pays (awardXp's unique ref), and the row remembers it.
 * Returns the XP it paid now.
 */
async function settle(row: Row) {
  if (!row.finishedAt || !row.userId || row.xp > 0 || row.score === 0) return 0;
  const amount = row.score * BLITZ_XP;
  if (!(await awardXp(row.userId, "blitz", `blitz:${row.day}`, amount)))
    return 0;
  await db
    .update(tgBlitz)
    .set({ xp: amount })
    .where(
      and(
        eq(tgBlitz.telegramId, row.telegramId),
        eq(tgBlitz.day, row.day),
        eq(tgBlitz.language, row.language),
      ),
    );
  row.xp = amount;
  return amount;
}

/** The ranking: the best score first, then the fastest. */
const better = (row: Row) =>
  or(
    gt(tgBlitz.score, row.score),
    and(eq(tgBlitz.score, row.score), lt(tgBlitz.ms, row.ms)),
  );

/**
 * A finished Blitz: the answers with explanations, where the player placed,
 * and the day's top ten (names only for learners who opted in to rankings).
 */
export async function blitzResult(
  player: Player,
  language: string,
  now = new Date(),
) {
  const day = blitzDay(now);
  const found = await getRow(player, day, language);
  if (!found) return null;
  const row = await closeIfExpired(found, now);
  if (!row.finishedAt) return null;
  const paid = await settle(row);

  const sameDay = and(
    eq(tgBlitz.day, day),
    eq(tgBlitz.language, language),
    isNotNull(tgBlitz.finishedAt),
  );
  const [[{ ahead }], [{ total }], top] = await Promise.all([
    db
      .select({ ahead: count() })
      .from(tgBlitz)
      .where(and(sameDay, better(row))),
    db.select({ total: count() }).from(tgBlitz).where(sameDay),
    db
      .select({
        telegramId: tgBlitz.telegramId,
        score: tgBlitz.score,
        ms: tgBlitz.ms,
        name: user.name,
        named: telegramLink.leaderboard,
      })
      .from(tgBlitz)
      .leftJoin(telegramLink, eq(telegramLink.userId, tgBlitz.userId))
      .leftJoin(user, eq(user.id, tgBlitz.userId))
      .where(sameDay)
      .orderBy(desc(tgBlitz.score), asc(tgBlitz.ms))
      .limit(10),
  ]);

  const questions = blitzQuestions(day, language);
  return {
    day,
    number: blitzNumber(day),
    language,
    score: row.score,
    size: questions.length,
    ms: row.ms,
    grid: row.answers.map((a) => a.ok),
    review: questions.map((q, i) => ({
      question: q[player.locale].question,
      options: q[player.locale].options,
      answer: q[player.locale].answer,
      choice: row.answers[i]?.c ?? null,
      explanation: q[player.locale].explanation ?? null,
    })),
    rank: ahead + 1,
    total,
    top: top.map((t) => ({
      score: t.score,
      ms: t.ms,
      name: t.named && t.name ? displayName(t.name) : null,
      you: t.telegramId === player.telegramId,
    })),
    xp: row.xp,
    /** XP paid by this call (for "+16 XP" once, and achievement checks) */
    paid,
  };
}

/** Today's Blitz in each language for the home screen: not started, going, or the score. */
export async function blitzOverview(player: Player, now = new Date()) {
  const day = blitzDay(now);
  const rows = await db
    .select()
    .from(tgBlitz)
    .where(
      and(eq(tgBlitz.telegramId, player.telegramId), eq(tgBlitz.day, day)),
    );
  const byLanguage = new Map(rows.map((r) => [r.language, r]));
  return {
    day,
    number: blitzNumber(day),
    /** Blitz XP is paid once a day: false once a Blitz has paid today */
    xpLeft: !rows.some((r) => r.xp > 0),
    languages: BLITZ_LANGUAGES.map((language) => {
      const row = byLanguage.get(language);
      const done = row && (row.finishedAt || now.getTime() > deadline(row));
      return {
        language,
        status: !row
          ? ("new" as const)
          : done
            ? ("done" as const)
            : ("playing" as const),
        score: row && done ? row.score : null,
      };
    }),
  };
}
