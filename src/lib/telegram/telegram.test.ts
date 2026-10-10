/**
 * Linking Telegram, evening reminders and the weekly leaderboard against a
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
vi.mock("@/lib/content", () => ({ getCourse: () => undefined }));
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
const { sendReminders, postLeaderboard } = await import("@/lib/telegram/jobs");
const { CHANNEL } = await import("@/lib/telegram/api");

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
  await client.exec(`TRUNCATE "user" CASCADE`);
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

/** A UTC±N zone where it's 8 pm right now, so the reminder is due. */
function eveningZone(now = new Date()) {
  let offset = (20 - now.getUTCHours() + 24) % 24;
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
    expect(String(message?.body.text)).toContain("1 day streak");

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
