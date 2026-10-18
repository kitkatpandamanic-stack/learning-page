import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { tgWordle } from "@/db/schema";
import { dailyIndex } from "@/lib/daily";
import { awardXp } from "@/lib/progress";
import { BLITZ_LANGUAGES, blitzDay, type Player } from "@/lib/tg-app/blitz";
import { wordleWords } from "@/lib/tg-app/words";

export const WORDLE_TRIES = 6;
/** The clue shows after this many wrong guesses (or at the end). */
export const HINT_AFTER = 3;
/** XP for solving, for the day's first solved word. */
export const WORDLE_XP = 10;
/** Code Wordle #1 */
const FIRST_DAY = "2026-10-18";

export type Mark = "g" | "y" | "x";

/**
 * Wordle's colours for a guess: g = right letter, right place; y = in the
 * word elsewhere; x = not in it. Repeated letters count as often as the
 * answer has them, right places first.
 */
export function marks(guess: string, answer: string): Mark[] {
  const result: Mark[] = Array(guess.length).fill("x");
  const left = new Map<string, number>();
  for (let i = 0; i < answer.length; i++) {
    if (guess[i] === answer[i]) result[i] = "g";
    else left.set(answer[i], (left.get(answer[i]) ?? 0) + 1);
  }
  for (let i = 0; i < guess.length; i++) {
    if (result[i] === "g") continue;
    const n = left.get(guess[i]) ?? 0;
    if (n > 0) {
      result[i] = "y";
      left.set(guess[i], n - 1);
    }
  }
  return result;
}

export function wordleNumber(day: string) {
  return (
    Math.round(
      (Date.parse(`${day}T12:00:00Z`) - Date.parse(`${FIRST_DAY}T12:00:00Z`)) /
        86_400_000,
    ) + 1
  );
}

/** The day's word in a language: the same for everyone, no repeats until the list runs out. */
export function wordOfDay(day: string, language: string) {
  const words = wordleWords[language];
  if (!words) return null;
  return words[dailyIndex(day, `wordle-${language}`, words.length)];
}

type Row = typeof tgWordle.$inferSelect;

const key = (player: Player, day: string, language: string) =>
  and(
    eq(tgWordle.telegramId, player.telegramId),
    eq(tgWordle.day, day),
    eq(tgWordle.language, language),
  );

async function getRow(player: Player, day: string, language: string) {
  const [row] = await db
    .select()
    .from(tgWordle)
    .where(key(player, day, language));
  return row ?? null;
}

/** What the player sees: the board so far; the clue and the word only when earned. */
function view(row: Row | null, day: string, language: string, player: Player) {
  const word = wordOfDay(day, language)!;
  const guesses = row?.guesses ?? [];
  const done = Boolean(row?.finishedAt);
  const wrong = guesses.filter((g) => g !== word.word).length;
  return {
    day,
    number: wordleNumber(day),
    language,
    length: word.word.length,
    tries: WORDLE_TRIES,
    rows: guesses.map((g) => ({ word: g, marks: marks(g, word.word) })),
    solved: row?.solved ?? false,
    done,
    hint: done || wrong >= HINT_AFTER ? word[player.locale] : null,
    answer: done ? word.word : null,
    xp: row?.xp ?? 0,
  };
}

export async function wordleToday(
  player: Player,
  language: string,
  now = new Date(),
) {
  if (!BLITZ_LANGUAGES.includes(language)) return null;
  const day = blitzDay(now);
  return view(await getRow(player, day, language), day, language, player);
}

/** Pays the day's first solved word to a linked learner. */
async function settle(row: Row) {
  if (!row.solved || !row.userId || row.xp > 0) return 0;
  if (!(await awardXp(row.userId, "wordle", `wordle:${row.day}`, WORDLE_XP)))
    return 0;
  await db
    .update(tgWordle)
    .set({ xp: WORDLE_XP })
    .where(
      and(
        eq(tgWordle.telegramId, row.telegramId),
        eq(tgWordle.day, row.day),
        eq(tgWordle.language, row.language),
      ),
    );
  row.xp = WORDLE_XP;
  return WORDLE_XP;
}

/**
 * One guess: any letters of the word's length count. Graded here; the word
 * is only sent once the game is over.
 */
export async function guessWordle(
  player: Player,
  language: string,
  guess: string,
  now = new Date(),
) {
  if (!BLITZ_LANGUAGES.includes(language)) return null;
  const day = blitzDay(now);
  const word = wordOfDay(day, language)!;
  const clean = guess.trim().toLowerCase();
  if (clean.length !== word.word.length || !/^[a-z]+$/.test(clean)) return null;

  await db
    .insert(tgWordle)
    .values({
      telegramId: player.telegramId,
      day,
      language,
      userId: player.userId,
    })
    .onConflictDoNothing();
  const solved = clean === word.word;
  const [row] = await db
    .update(tgWordle)
    .set({
      guesses: sql`${tgWordle.guesses} || ${JSON.stringify([clean])}::jsonb`,
      solved,
      finishedAt: sql`case when ${solved} or jsonb_array_length(${tgWordle.guesses}) + 1 >= ${WORDLE_TRIES} then ${now.toISOString()}::timestamp else null end`,
    })
    .where(
      and(
        key(player, day, language),
        sql`${tgWordle.finishedAt} is null`,
        sql`jsonb_array_length(${tgWordle.guesses}) < ${WORDLE_TRIES}`,
      ),
    )
    .returning();
  // Over already (or a double tap): show the board as it is.
  if (!row)
    return {
      ...view(await getRow(player, day, language), day, language, player),
      paid: 0,
    };
  const paid = await settle(row);
  return { ...view(row, day, language, player), paid };
}

/** Today's Wordle in each language, for the tab's language chips. */
export async function wordleOverview(player: Player, now = new Date()) {
  const day = blitzDay(now);
  const rows = await db
    .select()
    .from(tgWordle)
    .where(
      and(eq(tgWordle.telegramId, player.telegramId), eq(tgWordle.day, day)),
    );
  const byLanguage = new Map(rows.map((r) => [r.language, r]));
  return BLITZ_LANGUAGES.map((language) => {
    const row = byLanguage.get(language);
    return {
      language,
      status: !row?.guesses.length
        ? ("new" as const)
        : row.finishedAt
          ? row.solved
            ? ("solved" as const)
            : ("failed" as const)
          : ("playing" as const),
      tries: row?.guesses.length ?? 0,
    };
  });
}
