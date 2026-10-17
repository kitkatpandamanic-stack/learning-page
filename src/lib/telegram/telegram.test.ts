/**
 * Linking Telegram, reminders, quiz answers, achievement pictures, the daily
 * post and the weekly leaderboard against a
 * real PostgreSQL (PGlite) with the app's migrations. Telegram itself is a
 * fake `fetch` that records what the bot would send.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as schema from "@/db/schema";

vi.mock("server-only", () => ({}));

const client = new PGlite();
const testDb = drizzle(client, { schema });
vi.mock("@/db", () => ({ db: testDb }));
vi.mock("@/lib/content", () => ({
  getCourse: () => undefined,
  getLanguage: (slug: string) => ({ slug, name: slug.toUpperCase() }),
}));
const quiz = (question: string) => ({
  question,
  options: ["one", "two", "three"],
  answer: 1,
  explanation: "Because.",
});
vi.mock("@/lib/daily-feed", () => ({
  getPollQuizzes: () => [
    { permalink: "/learn/sql/select", en: quiz("Q?"), ru: quiz("В?") },
  ],
  clipExplanation: (text?: string) => text,
  getDailyFeed: (date: string) => ({
    date,
    problems: [],
    quiz: { en: quiz("Q?"), ru: quiz("В?") },
  }),
}));
const sqlProblems = () =>
  ["a", "b"].map((slug) => ({
    slug,
    permalink: `/practice/sql/${slug}`,
    title: `Problem ${slug}`,
    description: "",
    difficulty: "easy",
  }));
vi.mock("@/lib/practice", () => ({
  getPracticeLanguages: () => ["sql"],
  getProblems: sqlProblems,
  getDailyCandidates: sqlProblems,
}));

process.env.TELEGRAM_BOT_TOKEN = "test-token";
type Sent = { method: string; body: Record<string, unknown> };
let sent: Sent[] = [];
let reply: (method: string) => object = () => ({ ok: true, result: {} });
vi.stubGlobal(
  "fetch",
  vi.fn(async (url: string, init: RequestInit) => {
    const method = url.split("/").at(-1)!;
    sent.push({ method, body: JSON.parse(String(init.body)) });
    return Response.json(reply(method));
  }),
);

const links = await import("@/lib/telegram/links");
const { sendReminders, postLeaderboard, postDaily, runTick } =
  await import("@/lib/telegram/jobs");
const { CHANNEL } = await import("@/lib/telegram/api");
const { handleUpdate } = await import("@/lib/telegram/bot");
const { cronSecret } = await import("@/lib/telegram/secret");
const quizzes = await import("@/lib/telegram/quiz");

const dir = join(__dirname, "..", "..", "..", "drizzle");
for (const file of readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort()) {
  for (const statement of readFileSync(join(dir, file), "utf8").split(
    "--> statement-breakpoint",
  )) {
    await client.exec(statement);
  }
}

beforeEach(async () => {
  sent = [];
  reply = () => ({ ok: true, result: {} });
  await client.exec(`TRUNCATE "user", telegram_job_run CASCADE`);
  await testDb.insert(schema.user).values([
    { id: "u1", name: "Mei Lin", email: "mei@pandadev.test" },
    { id: "u2", name: "Bao", email: "bao@pandadev.test" },
    { id: "u3", name: "Private Person", email: "p@pandadev.test" },
  ]);
});

async function link(userId: string, telegramId: number, options = {}) {
  const token = await links.createLinkToken(userId, "en", "UTC");
  const result = await links.redeemLinkToken(token, { id: telegramId });
  if (Object.keys(options).length)
    await testDb
      .update(schema.telegramLink)
      .set(options)
      .where(eq(schema.telegramLink.userId, userId));
  return result;
}

describe("linking Telegram", () => {
  it("links with a one-time code", async () => {
    const token = await links.createLinkToken("u1", "ru", "Asia/Tashkent");
    expect(token).toMatch(/^[\w-]{24}$/);
    expect(
      await links.redeemLinkToken(token, { id: 42, username: "mei" }),
    ).toEqual({ ok: true, name: "Mei", locale: "ru" });
    expect(await links.redeemLinkToken(token, { id: 42 })).toEqual({
      ok: false,
      reason: "invalid",
    });
    const saved = await links.getLinkByTelegramId(42);
    expect(saved).toMatchObject({
      userId: "u1",
      username: "mei",
      timeZone: "Asia/Tashkent",
      reminders: false,
      leaderboard: false,
    });
  });

  it("refuses expired codes and Telegram accounts linked elsewhere", async () => {
    const token = await links.createLinkToken("u1", "en", "UTC");
    await testDb
      .update(schema.telegramLinkToken)
      .set({ expiresAt: new Date(Date.now() - 1000) });
    expect((await links.redeemLinkToken(token, { id: 1 })).ok).toBe(false);

    await link("u1", 7);
    expect(await link("u2", 7)).toEqual({ ok: false, reason: "taken" });
  });

  it("moves a learner to a new Telegram account when they link again", async () => {
    await link("u1", 7);
    await link("u1", 8);
    expect(await links.getLinkByTelegramId(7)).toBeNull();
    expect((await links.getLinkForUser("u1"))?.telegramId).toBe(8);
    await links.unlinkUser("u1");
    expect(await links.getLinkForUser("u1")).toBeNull();
  });
});

/** A UTC±N zone where it's `hour` o'clock right now (8 pm by default). */
function eveningZone(now = new Date(), hour = 20) {
  let offset = (hour - now.getUTCHours() + 24) % 24;
  if (offset > 14) offset -= 24;
  // Etc/GMT signs are reversed: Etc/GMT-5 is UTC+5.
  return offset === 0
    ? "Etc/GMT"
    : `Etc/GMT${offset > 0 ? "-" : "+"}${Math.abs(offset)}`;
}

describe("evening reminders", () => {
  const yesterday = () => new Date(Date.now() - 24 * 3_600_000);

  it("reminds once a day when the streak is at risk", async () => {
    const tz = eveningZone();
    await link("u1", 11, { reminders: true, timeZone: tz });
    await link("u2", 12, { reminders: false, timeZone: tz });
    for (const userId of ["u1", "u2"]) {
      await testDb.insert(schema.xpEvent).values({
        userId,
        amount: 10,
        reason: "exercise",
        ref: "x",
        createdAt: yesterday(),
      });
    }

    expect(await sendReminders()).toEqual({ checked: 1, sent: 1 });
    const message = sent.find((s) => s.method === "sendMessage");
    expect(message?.body.chat_id).toBe(11);
    expect(String(message?.body.text)).toContain("1 day streak is at risk");
    expect(String(message?.body.text)).toContain("new record: 2 days");
    expect(JSON.stringify(message?.body.reply_markup)).toContain(
      '"callback_data":"quiz"',
    );

    sent = [];
    expect((await sendReminders()).sent).toBe(0);
  });

  it("stays quiet after practice today, without a streak, or at other hours", async () => {
    const tz = eveningZone();
    await link("u1", 11, { reminders: true, timeZone: tz });
    await link("u2", 12, { reminders: true, timeZone: tz });
    await link("u3", 13, { reminders: true, timeZone: "UTC" });
    await testDb.insert(schema.xpEvent).values([
      {
        userId: "u1",
        amount: 5,
        reason: "quiz",
        ref: "a",
        createdAt: yesterday(),
      },
      {
        userId: "u1",
        amount: 5,
        reason: "quiz",
        ref: "b",
        createdAt: new Date(),
      },
    ]);
    const result = await sendReminders();
    expect(result.sent).toBe(0);
  });

  it("catches up later in the evening, but not after 11 pm", async () => {
    await link("u1", 11, {
      reminders: true,
      timeZone: eveningZone(new Date(), 22),
    });
    await link("u2", 12, {
      reminders: true,
      timeZone: eveningZone(new Date(), 23),
    });
    for (const userId of ["u1", "u2"]) {
      await testDb.insert(schema.xpEvent).values({
        userId,
        amount: 10,
        reason: "exercise",
        ref: "x",
        createdAt: yesterday(),
      });
    }
    expect(await sendReminders()).toEqual({ checked: 2, sent: 1 });
    expect(sent.find((s) => s.method === "sendMessage")?.body.chat_id).toBe(11);
  });

  it("turns reminders off for learners who blocked the bot", async () => {
    const tz = eveningZone();
    await link("u1", 11, { reminders: true, timeZone: tz });
    await testDb.insert(schema.xpEvent).values({
      userId: "u1",
      amount: 10,
      reason: "exercise",
      ref: "x",
      createdAt: yesterday(),
    });
    reply = () => ({
      ok: false,
      error_code: 403,
      description: "Forbidden: bot was blocked by the user",
    });
    expect((await sendReminders()).sent).toBe(0);
    expect((await links.getLinkForUser("u1"))?.reminders).toBe(false);
  });
});

describe("reminder time and pause", () => {
  const yesterday = () => new Date(Date.now() - 24 * 3_600_000);
  async function streakOfOne(userId: string) {
    await testDb.insert(schema.xpEvent).values({
      userId,
      amount: 10,
      reason: "exercise",
      ref: "x",
      createdAt: yesterday(),
    });
  }

  it("goes out at the hour the learner picked", async () => {
    const morning = eveningZone(new Date(), 9);
    await link("u1", 11, { reminders: true, timeZone: morning });
    await link("u2", 12, {
      reminders: true,
      timeZone: morning,
      reminderHour: 8,
    });
    await streakOfOne("u1");
    await streakOfOne("u2");
    // u1 keeps the 8 pm default; u2's 8 am reminder is an hour late: catch up.
    expect(await sendReminders()).toEqual({ checked: 2, sent: 1 });
    expect(sent.find((s) => s.method === "sendMessage")?.body.chat_id).toBe(12);
  });

  it("waits while paused, and comes back on the day it ends", async () => {
    const tz = eveningZone();
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(
      new Date(),
    );
    const tomorrow = new Date(Date.now() + 86_400_000);
    await link("u1", 11, {
      reminders: true,
      timeZone: tz,
      remindersResumeOn: new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
      }).format(tomorrow),
    });
    await link("u2", 12, {
      reminders: true,
      timeZone: tz,
      remindersResumeOn: today,
    });
    await streakOfOne("u1");
    await streakOfOne("u2");
    expect(await sendReminders()).toEqual({ checked: 2, sent: 1 });
    expect(sent.find((s) => s.method === "sendMessage")?.body.chat_id).toBe(12);
  });

  it("gives the day back when Telegram fails, so a later run retries", async () => {
    await link("u1", 11, { reminders: true, timeZone: eveningZone() });
    await streakOfOne("u1");
    reply = () => ({ ok: false, error_code: 500, description: "oops" });
    await expect(sendReminders()).rejects.toThrow();
    expect((await links.getLinkForUser("u1"))?.lastReminded).toBeNull();
    reply = () => ({ ok: true, result: {} });
    expect((await sendReminders()).sent).toBe(1);
  });

  it("sets the hour and a pause from /settings buttons", async () => {
    await link("u1", 11);
    const press = (data: string) =>
      handleUpdate({
        callback_query: {
          id: "q",
          from: { id: 11 },
          data,
          message: { chat: { id: 11 }, message_id: 5 },
        },
      });
    await press("menu:hour");
    expect(JSON.stringify(sent.at(-2)?.body.reply_markup)).toContain("hour:19");
    await press("hour:19");
    let saved = await links.getLinkForUser("u1");
    expect(saved).toMatchObject({ reminders: true, reminderHour: 19 });
    await press("pause:3");
    saved = await links.getLinkForUser("u1");
    expect(saved?.remindersResumeOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(String(sent.at(-2)?.body.text)).toContain("Paused, back on");
    await press("pause:0");
    expect((await links.getLinkForUser("u1"))?.remindersResumeOn).toBeNull();
    await press("toggle:pings");
    expect((await links.getLinkForUser("u1"))?.pings).toBe(false);
    // Made-up buttons do nothing.
    await press("hour:3");
    expect((await links.getLinkForUser("u1"))?.reminderHour).toBe(19);
  });
});

describe("quizzes in the bot", () => {
  let polls = 0;
  beforeEach(() => {
    reply = (method) =>
      method === "sendPoll"
        ? { ok: true, result: { poll: { id: `p${++polls}` } } }
        : { ok: true, result: {} };
  });
  const answer = (pollId: string, option: number, from = 11) =>
    handleUpdate({
      poll_answer: {
        poll_id: pollId,
        user: { id: from },
        option_ids: [option],
      },
    });
  const lastPoll = () => `p${polls}`;

  it("pays XP for a right answer, once per poll, and replies", async () => {
    await link("u1", 11);
    await handleUpdate({
      message: {
        chat: { id: 11, type: "private" },
        from: { id: 11 },
        text: "/quiz",
      },
    });
    const poll = sent.find((s) => s.method === "sendPoll")!;
    expect(poll.body.is_anonymous).toBe(false);
    await answer(lastPoll(), 1);
    await answer(lastPoll(), 1);
    const events = await testDb.select().from(schema.xpEvent);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ reason: "telegram", amount: 5 });
    const replies = sent.filter((s) => s.method === "sendMessage");
    expect(replies).toHaveLength(1);
    expect(String(replies[0].body.text)).toContain("+5 XP");
    expect(String(replies[0].body.text)).toContain("Quiz streak: 1 day");
    expect(String(replies[0].body.text)).toContain("1/1 right this week");
  });

  it("explains a wrong answer, without XP", async () => {
    await link("u1", 11);
    await quizzes.sendQuiz(11, "en", await links.getLinkForUser("u1"));
    await answer(lastPoll(), 0);
    expect(await testDb.select().from(schema.xpEvent)).toHaveLength(0);
    const text = String(
      sent.find((s) => s.method === "sendMessage")?.body.text,
    );
    expect(text).toContain("The answer: <b>two</b>");
    expect(text).toContain("0/1 right this week");
  });

  it("caps the day's quiz XP but still counts the answers", async () => {
    await link("u1", 11);
    const linked = await links.getLinkForUser("u1");
    for (let i = 0; i < quizzes.BOT_QUIZ_DAILY + 1; i++) {
      await quizzes.sendQuiz(11, "en", linked);
      await answer(lastPoll(), 1);
    }
    const events = await testDb.select().from(schema.xpEvent);
    expect(events).toHaveLength(quizzes.BOT_QUIZ_DAILY);
    expect(await quizzes.getQuizStats("u1", "UTC")).toEqual({
      answered: 6,
      correct: 6,
      streak: 1,
    });
  });

  it("doesn't remember polls in groups or for people who aren't linked", async () => {
    await link("u1", 11);
    await quizzes.sendQuiz(-100, "en", await links.getLinkForUser("u1"));
    await quizzes.sendQuiz(99, "en", null);
    expect(await testDb.select().from(schema.telegramQuiz)).toHaveLength(0);
  });

  it("sends a picture when a right answer unlocks an achievement", async () => {
    await link("u1", 11);
    await testDb.insert(schema.xpEvent).values({
      userId: "u1",
      amount: 95,
      reason: "lesson",
      ref: "/learn/sql/select",
    });
    await quizzes.sendQuiz(11, "en", await links.getLinkForUser("u1"));
    await answer(lastPoll(), 1);
    const photo = sent.find((s) => s.method === "sendPhoto");
    expect(photo?.body.photo).toContain(
      "/api/telegram/achievement-card?id=xp-100&lang=en",
    );
    expect(String(photo?.body.caption)).toContain(
      "Achievement unlocked: Century",
    );
  });

  it("counts the quiz streak over days in a row with a right answer", async () => {
    await link("u1", 11);
    const day = (n: number) =>
      new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
    await testDb.insert(schema.telegramQuiz).values([
      {
        pollId: "a",
        userId: "u1",
        ref: "x#0",
        correctOption: 1,
        day: day(0),
        correct: true,
      },
      {
        pollId: "b",
        userId: "u1",
        ref: "x#0",
        correctOption: 1,
        day: day(1),
        correct: true,
      },
      {
        pollId: "c",
        userId: "u1",
        ref: "x#0",
        correctOption: 1,
        day: day(2),
        correct: false,
      },
      {
        pollId: "d",
        userId: "u1",
        ref: "x#0",
        correctOption: 1,
        day: day(9),
        correct: true,
      },
    ]);
    expect(await quizzes.getQuizStats("u1", "UTC")).toEqual({
      answered: 3,
      correct: 2,
      streak: 2,
    });
  });
});

describe("scheduled posts", () => {
  // 12:30 in Tashkent on a Monday.
  const monday = new Date("2026-10-12T07:30:00Z");

  it("posts the daily post once however many schedulers ask", async () => {
    expect(await postDaily(monday)).toEqual({ posted: true, polls: 2 });
    expect(await postDaily(monday)).toEqual({ posted: false, already: true });
    expect(sent.filter((s) => s.method === "sendPhoto")).toHaveLength(1);
    expect(sent.find((s) => s.method === "sendPhoto")?.body.chat_id).toBe(
      CHANNEL,
    );
  });

  it("tries again later when the picture didn't go out", async () => {
    reply = () => ({ ok: false, error_code: 400, description: "bad photo" });
    await expect(postDaily(monday)).rejects.toThrow();
    reply = () => ({ ok: true, result: {} });
    expect((await postDaily(monday)).posted).toBe(true);
  });

  it("runs what's due on each tick", async () => {
    const early = new Date("2026-10-12T04:00:00Z"); // 9:00 in Tashkent
    expect(Object.keys((await runTick(early)).results)).toEqual([
      "reminders",
      "cleanup",
    ]);
    const tick = await runTick(monday);
    expect(tick.ok).toBe(true);
    expect(Object.keys(tick.results)).toEqual([
      "reminders",
      "daily-post",
      "leaderboard",
      "cleanup",
    ]);
  });

  it("keeps going when one job fails", async () => {
    reply = (method) =>
      method === "sendPhoto"
        ? { ok: false, error_code: 400, description: "bad photo" }
        : { ok: true, result: {} };
    const tick = await runTick(monday);
    expect(tick.ok).toBe(false);
    expect(tick.results["daily-post"]).toBe("failed");
    expect(tick.results.cleanup).toBe("ok");
  });
});

describe("weekly leaderboard", () => {
  const monday = new Date("2026-10-12T06:30:00Z");
  const at = (iso: string) => new Date(iso);

  it("posts last week's XP of learners who opted in", async () => {
    await link("u1", 1, { leaderboard: true });
    await link("u2", 2, { leaderboard: true });
    await link("u3", 3, { leaderboard: false });
    await testDb.insert(schema.xpEvent).values([
      {
        userId: "u1",
        amount: 30,
        reason: "quiz",
        ref: "1",
        createdAt: at("2026-10-06T10:00:00Z"),
      },
      {
        userId: "u2",
        amount: 50,
        reason: "quiz",
        ref: "2",
        createdAt: at("2026-10-11T23:00:00Z"),
      },
      {
        userId: "u3",
        amount: 99,
        reason: "quiz",
        ref: "3",
        createdAt: at("2026-10-08T10:00:00Z"),
      },
      // Outside the week: before it, and today.
      {
        userId: "u1",
        amount: 500,
        reason: "quiz",
        ref: "4",
        createdAt: at("2026-10-04T10:00:00Z"),
      },
      {
        userId: "u1",
        amount: 500,
        reason: "quiz",
        ref: "5",
        createdAt: at("2026-10-12T01:00:00Z"),
      },
    ]);

    expect(await postLeaderboard(monday)).toEqual({ posted: true, entries: 2 });
    const post = sent.find((s) => s.method === "sendMessage")!;
    expect(post.body.chat_id).toBe(CHANNEL);
    const text = String(post.body.text);
    expect(text).toContain("🥇 Bao · <b>50 XP</b>");
    expect(text).toContain("🥈 Mei L. · <b>30 XP</b>");
    expect(text).not.toContain("Private");
    expect(text).toContain("October 5 – October 11");
  });

  it("skips the post when nobody opted in has XP", async () => {
    await link("u1", 1, { leaderboard: true });
    expect(await postLeaderboard(monday)).toEqual({
      posted: false,
      entries: 0,
    });
    expect(sent.filter((s) => s.method === "sendMessage")).toHaveLength(0);
  });
});

describe("the scheduler's secret", () => {
  it("comes in X-Cron-Secret or as a Bearer token", () => {
    expect(cronSecret(new Headers({ "X-Cron-Secret": "abc" }))).toBe("abc");
    expect(cronSecret(new Headers({ Authorization: "Bearer abc" }))).toBe(
      "abc",
    );
    // cron-job.org may still send an Authorization header of its own.
    expect(
      cronSecret(
        new Headers({ "X-Cron-Secret": "abc", Authorization: "Basic xyz" }),
      ),
    ).toBe("abc");
    expect(cronSecret(new Headers())).toBeNull();
  });
});
