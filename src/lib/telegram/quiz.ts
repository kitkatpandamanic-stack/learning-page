import "server-only";

import { and, count, eq, gte, isNull, lt, sql } from "drizzle-orm";

import { db } from "@/db";
import { telegramQuiz } from "@/db/schema";
import { clipExplanation, getPollQuizzes } from "@/lib/daily-feed";
import { computeStreaks } from "@/lib/gamification";
import { awardXp } from "@/lib/progress";
import { telegram } from "@/lib/telegram/api";
import type { TelegramLink } from "@/lib/telegram/links";
import {
  anotherQuizKeyboard,
  dayIn,
  quizAnswerText,
  type BotLocale,
  type QuizStats,
} from "@/lib/telegram/texts";

/** XP for a right answer in the bot, and how many a day pay out. */
export const BOT_QUIZ_XP = 5;
export const BOT_QUIZ_DAILY = 5;

function addDays(day: string, n: number) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * A random lesson quiz as a Telegram quiz poll. In a private chat with a
 * linked learner the poll is remembered, so the answer can earn XP.
 */
export async function sendQuiz(
  chatId: number,
  locale: BotLocale,
  link: TelegramLink | null,
) {
  const quizzes = getPollQuizzes();
  const index = Math.floor(Math.random() * quizzes.length);
  const pick = quizzes[index];
  if (!pick) return;
  const quiz = pick[locale];
  const message = await telegram<{ poll?: { id: string } }>("sendPoll", {
    chat_id: chatId,
    question: quiz.question,
    options: quiz.options.map((text) => ({ text })),
    type: "quiz",
    correct_option_id: quiz.answer,
    explanation: clipExplanation(quiz.explanation),
    // Answers only reach the bot from polls that aren't anonymous.
    is_anonymous: false,
  });
  // A private chat's id is the learner's Telegram id.
  if (link && chatId === link.telegramId && message.poll?.id) {
    await db
      .insert(telegramQuiz)
      .values({
        pollId: message.poll.id,
        userId: link.userId,
        ref: `${pick.permalink}#${index}`,
        correctOption: quiz.answer,
      })
      .onConflictDoNothing();
  }
}

/** The last 7 days' answers and the quiz streak (days in a row with a right answer). */
export async function getQuizStats(
  userId: string,
  timeZone: string,
  now = new Date(),
): Promise<QuizStats> {
  const today = dayIn(timeZone, now);
  const [week, rightDays] = await Promise.all([
    db
      .select({ correct: telegramQuiz.correct, n: count() })
      .from(telegramQuiz)
      .where(
        and(
          eq(telegramQuiz.userId, userId),
          gte(telegramQuiz.day, addDays(today, -6)),
        ),
      )
      .groupBy(telegramQuiz.correct),
    db
      .selectDistinct({ day: telegramQuiz.day })
      .from(telegramQuiz)
      .where(
        and(eq(telegramQuiz.userId, userId), eq(telegramQuiz.correct, true)),
      ),
  ]);
  const answered = week.reduce((n, r) => n + r.n, 0);
  const correct = week.find((r) => r.correct)?.n ?? 0;
  const { current } = computeStreaks(
    rightDays.flatMap((r) => (r.day ? [r.day] : [])),
    today,
  );
  return { answered, correct, streak: current };
}

/**
 * A poll_answer update: the learner answered a quiz the bot sent. The first
 * answer counts (Telegram quizzes can't be changed); right answers pay XP,
 * a few a day, which also keeps the site streak going.
 */
export async function recordPollAnswer(
  pollId: string,
  optionIds: number[],
  link: TelegramLink | null,
  now = new Date(),
) {
  if (!link || optionIds.length === 0) return null;
  const day = dayIn(link.timeZone, now);
  const [row] = await db
    .update(telegramQuiz)
    .set({
      day,
      correct: sql`${telegramQuiz.correctOption} = ${optionIds[0]}`,
    })
    .where(
      and(
        eq(telegramQuiz.pollId, pollId),
        eq(telegramQuiz.userId, link.userId),
        isNull(telegramQuiz.day),
      ),
    )
    .returning();
  if (!row) return null;
  const correct = row.correct === true;

  let xp = 0;
  if (correct) {
    // The n-th right answer today pays once, up to BOT_QUIZ_DAILY a day.
    const [{ n }] = await db
      .select({ n: count() })
      .from(telegramQuiz)
      .where(
        and(
          eq(telegramQuiz.userId, link.userId),
          eq(telegramQuiz.day, day),
          eq(telegramQuiz.correct, true),
        ),
      );
    if (
      n <= BOT_QUIZ_DAILY &&
      (await awardXp(link.userId, "telegram", `quiz:${day}:${n}`, BOT_QUIZ_XP))
    )
      xp = BOT_QUIZ_XP;
  }
  return { correct, xp, ref: row.ref, correctOption: row.correctOption };
}

/** Tells the learner how the answer went, with a button for another one. */
export async function replyToAnswer(
  link: TelegramLink,
  result: NonNullable<Awaited<ReturnType<typeof recordPollAnswer>>>,
) {
  const locale = link.locale as BotLocale;
  const [permalink, index] = result.ref.split("#");
  const quiz = getPollQuizzes().find(
    (q, i) => q.permalink === permalink && i === Number(index),
  );
  const answer = quiz?.[locale].options[result.correctOption] ?? "";
  await telegram("sendMessage", {
    chat_id: link.telegramId,
    text: quizAnswerText(locale, {
      correct: result.correct,
      xp: result.xp,
      answer,
      stats: await getQuizStats(link.userId, link.timeZone),
    }),
    parse_mode: "HTML",
    reply_markup: anotherQuizKeyboard(locale),
  });
}

/** Polls nobody answered within two days won't be; answered ones stay for the streak. */
export async function forgetUnansweredQuizzes(now = new Date()) {
  await db
    .delete(telegramQuiz)
    .where(
      and(
        isNull(telegramQuiz.day),
        lt(telegramQuiz.sentAt, new Date(now.getTime() - 2 * 86_400_000)),
      ),
    );
}
