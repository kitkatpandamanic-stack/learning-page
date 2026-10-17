import "server-only";

import { randomBytes, randomInt } from "node:crypto";
import { and, asc, count, desc, eq, gte, like, lt, sql } from "drizzle-orm";

import { db } from "@/db";
import { tgDuel, tgDuelPlay, xpEvent } from "@/db/schema";
import { getPollQuizzes } from "@/lib/daily-feed";
import { awardXp } from "@/lib/progress";
import { BLITZ_LANGUAGES, blitzDay, type Player } from "@/lib/tg-app/blitz";

/** Questions in a duel, seconds to answer them, slack for a slow network. */
export const DUEL_SIZE = 5;
export const DUEL_SECONDS = 30;
const GRACE_MS = 3000;
/** How long a shared challenge stays open. */
const DUEL_HOURS = 48;
/** XP for finishing a duel (with a right answer), and for winning one. */
export const DUEL_XP = 5;
export const DUEL_WIN_XP = 5;
/** Duels that pay XP each day; more can be played for fun. */
export const DUELS_PAYING_PER_DAY = 3;
/** Challenges one person can start in a day. */
const DUELS_CREATED_PER_DAY = 20;

type Play = typeof tgDuelPlay.$inferSelect;
type Duel = typeof tgDuel.$inferSelect;

/** A lesson quiz's stable name: its lesson and its place among that lesson's quizzes. */
function pool(language: string) {
  const seen = new Map<string, number>();
  return getPollQuizzes().flatMap((q) => {
    const n = seen.get(q.permalink) ?? 0;
    seen.set(q.permalink, n + 1);
    return q.permalink.startsWith(`/learn/${language}/`)
      ? [{ ref: `${q.permalink}#${n}`, quiz: q }]
      : [];
  });
}

function questionsOf(duel: Duel) {
  const byRef = new Map(pool(duel.language).map((p) => [p.ref, p.quiz]));
  const quizzes = duel.refs.map((ref) => byRef.get(ref));
  // A lesson changed since the duel began: it can't be played fairly.
  return quizzes.every(Boolean) ? quizzes.map((q) => q!) : null;
}

/** Telegram first names are the players' own; keep them short. */
export const playerName = (firstName: string) =>
  firstName.trim().slice(0, 32) || "Panda";

/** The Tashkent day's start, for "duels today". */
const dayStart = (now: Date) => new Date(`${blitzDay(now)}T00:00:00+05:00`);

/**
 * A new challenge in a language: five random questions from the lessons.
 * The challenger plays it first, then shares it.
 */
export async function createDuel(
  player: Player,
  name: string,
  language: string,
  now = new Date(),
) {
  if (!BLITZ_LANGUAGES.includes(language)) return null;
  const [{ today }] = await db
    .select({ today: count() })
    .from(tgDuel)
    .where(
      and(
        eq(tgDuel.creatorTelegramId, player.telegramId),
        gte(tgDuel.createdAt, dayStart(now)),
      ),
    );
  if (today >= DUELS_CREATED_PER_DAY) return { limit: true as const };

  // The first few of a shuffled pool: no repeats.
  const all = pool(language).map((p) => p.ref);
  for (let i = all.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [all[i], all[j]] = [all[j], all[i]];
  }
  const refs = all.slice(0, DUEL_SIZE);
  if (refs.length === 0) return null;
  const id = randomBytes(8).toString("base64url");
  await db.insert(tgDuel).values({
    id,
    creatorTelegramId: player.telegramId,
    creatorUserId: player.userId,
    creatorName: name,
    creatorLocale: player.locale,
    language,
    refs,
    createdAt: now,
    expiresAt: new Date(now.getTime() + DUEL_HOURS * 3_600_000),
  });
  return { id };
}

async function getDuel(id: string) {
  if (!/^[\w-]{6,16}$/.test(id)) return null;
  const [duel] = await db.select().from(tgDuel).where(eq(tgDuel.id, id));
  return duel ?? null;
}

const playKey = (duelId: string, telegramId: number) =>
  and(eq(tgDuelPlay.duelId, duelId), eq(tgDuelPlay.telegramId, telegramId));

async function getPlay(duelId: string, telegramId: number) {
  const [play] = await db
    .select()
    .from(tgDuelPlay)
    .where(playKey(duelId, telegramId));
  return play ?? null;
}

const deadline = (play: Play) =>
  play.startedAt.getTime() + DUEL_SECONDS * 1000 + GRACE_MS;

async function closeIfExpired(play: Play, now: Date) {
  if (play.finishedAt || now.getTime() <= deadline(play)) return play;
  const [closed] = await db
    .update(tgDuelPlay)
    .set({
      finishedAt: new Date(play.startedAt.getTime() + DUEL_SECONDS * 1000),
    })
    .where(
      and(
        playKey(play.duelId, play.telegramId),
        sql`${tgDuelPlay.finishedAt} is null`,
      ),
    )
    .returning();
  return closed ?? (await getPlay(play.duelId, play.telegramId)) ?? play;
}

/** The challenger's finished play: the score to beat. */
async function challengerPlay(duel: Duel, now: Date) {
  const play = await getPlay(duel.id, duel.creatorTelegramId);
  return play ? closeIfExpired(play, now) : null;
}

const summary = (play: Play | null) =>
  play?.finishedAt ? { score: play.score, ms: play.ms } : null;

/**
 * What someone who opened a duel sees before playing: who challenged them,
 * in which language, and the score to beat. No questions yet.
 */
export async function duelInfo(player: Player, id: string, now = new Date()) {
  const duel = await getDuel(id);
  if (!duel) return null;
  const [mine, theirs] = await Promise.all([
    getPlay(duel.id, player.telegramId),
    challengerPlay(duel, now),
  ]);
  return {
    id: duel.id,
    language: duel.language,
    challenger: duel.creatorName,
    yours: duel.creatorTelegramId === player.telegramId,
    toBeat: summary(theirs),
    played: Boolean(mine),
    expired: now > duel.expiresAt,
    size: duel.refs.length,
  };
}

/**
 * Starts the player's go at a duel, or picks it up. Newcomers can join only
 * while it's open, and only after the challenger has played.
 */
export async function startDuel(
  player: Player,
  name: string,
  id: string,
  now = new Date(),
) {
  const duel = await getDuel(id);
  if (!duel) return null;
  const questions = questionsOf(duel);
  if (!questions) return null;
  let play = await getPlay(duel.id, player.telegramId);
  if (!play) {
    const challenger = duel.creatorTelegramId === player.telegramId;
    if (!challenger) {
      if (now > duel.expiresAt) return { expired: true as const };
      if (!summary(await challengerPlay(duel, now))) return null;
    }
    await db
      .insert(tgDuelPlay)
      .values({
        duelId: duel.id,
        telegramId: player.telegramId,
        userId: player.userId,
        name,
        startedAt: now,
      })
      .onConflictDoNothing();
    play = (await getPlay(duel.id, player.telegramId))!;
  }
  play = await closeIfExpired(play, now);
  return {
    id: duel.id,
    language: duel.language,
    questions: questions.map((q) => ({
      question: q[player.locale].question,
      options: q[player.locale].options,
    })),
    answered: play.answers.length,
    left: play.finishedAt
      ? 0
      : Math.max(
          0,
          DUEL_SECONDS * 1000 - (now.getTime() - play.startedAt.getTime()),
        ),
    done: Boolean(play.finishedAt),
  };
}

/** One answer, in order, graded here; late answers don't count. */
export async function answerDuel(
  player: Player,
  id: string,
  index: number,
  choice: number,
  now = new Date(),
) {
  const duel = await getDuel(id);
  const found = duel && (await getPlay(duel.id, player.telegramId));
  if (!duel || !found) return null;
  const play = await closeIfExpired(found, now);
  if (play.finishedAt) return { counted: false as const, done: true };
  const questions = questionsOf(duel);
  const question = questions?.[index];
  if (!question || index !== play.answers.length) return null;
  if (!Number.isInteger(choice) || choice < 0) return null;

  const answer = question[player.locale].answer;
  const ok = choice === answer;
  const ms = Math.min(
    now.getTime() - play.startedAt.getTime(),
    DUEL_SECONDS * 1000,
  );
  const last = index + 1 >= questions!.length;
  const [updated] = await db
    .update(tgDuelPlay)
    .set({
      answers: sql`${tgDuelPlay.answers} || ${JSON.stringify([{ c: choice, ok, ms }])}::jsonb`,
      score: sql`${tgDuelPlay.score} + ${ok ? 1 : 0}`,
      ms,
      finishedAt: last ? now : null,
    })
    .where(
      and(
        playKey(duel.id, player.telegramId),
        sql`${tgDuelPlay.finishedAt} is null`,
        sql`jsonb_array_length(${tgDuelPlay.answers}) = ${index}`,
      ),
    )
    .returning();
  if (!updated) return null;
  return { counted: true as const, correct: ok, answer, done: last };
}

/** Higher score wins; the same score goes to the faster one. */
const beats = (
  a: { score: number; ms: number },
  b: { score: number; ms: number },
) => a.score > b.score || (a.score === b.score && a.ms < b.ms);

/** How many duels have paid this learner XP today. */
async function paidToday(userId: string, now: Date) {
  const [{ n }] = await db
    .select({ n: count() })
    .from(xpEvent)
    .where(
      and(
        eq(xpEvent.userId, userId),
        eq(xpEvent.reason, "duel"),
        like(xpEvent.ref, "duel:%"),
        gte(xpEvent.createdAt, dayStart(now)),
      ),
    );
  return n;
}

/**
 * XP for a finished play: +5 for finishing with a right answer, +5 more for
 * beating the challenger, in the first few duels a day. A challenger who
 * finished a paying duel gets the win bonus when the first friend finishes
 * behind them. Returns what the player was paid now, and whether the
 * challenger won a bonus.
 */
async function settle(
  duel: Duel,
  play: Play,
  challenger: Play | null,
  now: Date,
) {
  if (!play.finishedAt || play.xp > 0 || !play.userId || play.score === 0)
    return { paid: 0, challengerBonus: false };
  if ((await paidToday(play.userId, now)) >= DUELS_PAYING_PER_DAY)
    return { paid: 0, challengerBonus: false };
  const isChallenger = play.telegramId === duel.creatorTelegramId;
  const won =
    !isChallenger && challenger?.finishedAt ? beats(play, challenger) : false;
  const amount = DUEL_XP + (won ? DUEL_WIN_XP : 0);
  if (!(await awardXp(play.userId, "duel", `duel:${duel.id}`, amount)))
    return { paid: 0, challengerBonus: false };
  await db
    .update(tgDuelPlay)
    .set({ xp: amount })
    .where(playKey(duel.id, play.telegramId));
  play.xp = amount;

  // The challenger held them off: their win bonus, once per duel, if this
  // duel paid them for playing it.
  let challengerBonus = false;
  if (
    !isChallenger &&
    !won &&
    challenger?.userId &&
    challenger.xp > 0 &&
    (await awardXp(
      challenger.userId,
      "duel",
      `duel-win:${duel.id}`,
      DUEL_WIN_XP,
    ))
  ) {
    await db
      .update(tgDuelPlay)
      .set({ xp: sql`${tgDuelPlay.xp} + ${DUEL_WIN_XP}` })
      .where(playKey(duel.id, challenger.telegramId));
    challengerBonus = true;
  }
  return { paid: amount, challengerBonus };
}

/**
 * A finished play: score, answers with explanations, the duel's ranking,
 * and how it went against the challenger. Pays the XP the first time.
 */
export async function duelResult(player: Player, id: string, now = new Date()) {
  const duel = await getDuel(id);
  const found = duel && (await getPlay(duel.id, player.telegramId));
  if (!duel || !found) return null;
  const play = await closeIfExpired(found, now);
  if (!play.finishedAt) return null;
  const questions = questionsOf(duel);
  if (!questions) return null;
  const challenger =
    play.telegramId === duel.creatorTelegramId
      ? play
      : await challengerPlay(duel, now);
  const { paid, challengerBonus } = await settle(duel, play, challenger, now);

  const ranking = await db
    .select({
      telegramId: tgDuelPlay.telegramId,
      name: tgDuelPlay.name,
      score: tgDuelPlay.score,
      ms: tgDuelPlay.ms,
    })
    .from(tgDuelPlay)
    .where(
      and(
        eq(tgDuelPlay.duelId, duel.id),
        sql`${tgDuelPlay.finishedAt} is not null`,
      ),
    )
    .orderBy(desc(tgDuelPlay.score), asc(tgDuelPlay.ms))
    .limit(20);

  const isChallenger = play.telegramId === duel.creatorTelegramId;
  // The challenger hears about each friend's result once.
  const notifyNow =
    !isChallenger &&
    Boolean(challenger?.finishedAt) &&
    (
      await db
        .update(tgDuelPlay)
        .set({ notified: true })
        .where(
          and(
            playKey(duel.id, play.telegramId),
            eq(tgDuelPlay.notified, false),
          ),
        )
        .returning({ duelId: tgDuelPlay.duelId })
    ).length > 0;
  return {
    id: duel.id,
    language: duel.language,
    challenger: duel.creatorName,
    yours: isChallenger,
    score: play.score,
    size: questions.length,
    ms: play.ms,
    grid: play.answers.map((a) => a.ok),
    review: questions.map((q, i) => ({
      question: q[player.locale].question,
      options: q[player.locale].options,
      answer: q[player.locale].answer,
      choice: play.answers[i]?.c ?? null,
      explanation: q[player.locale].explanation ?? null,
    })),
    /** Against the challenger: null for the challenger themself */
    outcome:
      isChallenger || !challenger?.finishedAt
        ? null
        : beats(play, challenger)
          ? ("won" as const)
          : ("lost" as const),
    toBeat: isChallenger ? null : summary(challenger),
    ranking: ranking.map((r) => ({
      name: r.name,
      score: r.score,
      ms: r.ms,
      you: r.telegramId === player.telegramId,
      challenger: r.telegramId === duel.creatorTelegramId,
    })),
    xp: play.xp,
    paid,
    /** For the bot's message to the challenger */
    notify:
      notifyNow && challenger
        ? {
            telegramId: duel.creatorTelegramId,
            locale: duel.creatorLocale,
            challengerBonus,
            them: { name: play.name, score: play.score, ms: play.ms },
            you: { score: challenger.score, ms: challenger.ms },
          }
        : null,
  };
}

/** The player's last few duels, for the Duel tab. */
export async function recentDuels(player: Player) {
  const rows = await db
    .select({
      id: tgDuel.id,
      language: tgDuel.language,
      challenger: tgDuel.creatorName,
      creatorTelegramId: tgDuel.creatorTelegramId,
      score: tgDuelPlay.score,
      finishedAt: tgDuelPlay.finishedAt,
      players: sql<number>`(select count(*) from ${tgDuelPlay} p where p.duel_id = ${tgDuel.id} and p.finished_at is not null)`,
    })
    .from(tgDuelPlay)
    .innerJoin(tgDuel, eq(tgDuel.id, tgDuelPlay.duelId))
    .where(eq(tgDuelPlay.telegramId, player.telegramId))
    .orderBy(desc(tgDuelPlay.startedAt))
    .limit(5);
  return rows.map((r) => ({
    id: r.id,
    language: r.language,
    challenger: r.challenger,
    yours: r.creatorTelegramId === player.telegramId,
    score: r.finishedAt ? r.score : null,
    players: Number(r.players),
  }));
}

/** Duels a month past their end are of no more use. */
export async function forgetOldDuels(now = new Date()) {
  await db
    .delete(tgDuel)
    .where(lt(tgDuel.expiresAt, new Date(now.getTime() - 30 * 86_400_000)));
}
