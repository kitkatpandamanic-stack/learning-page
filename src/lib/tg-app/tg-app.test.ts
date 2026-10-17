/**
 * The Telegram Mini App: signed launch data, the panda, share pictures, and
 * the Daily Blitz against a real PostgreSQL (PGlite) with the migrations.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as schema from "@/db/schema";
import { parseCard, cardQuery } from "@/lib/tg-app/card";
import { signInitData, validateInitData } from "@/lib/telegram/init-data";
import {
  pandaMood,
  pandaStage,
  pandaSvg,
  parseOutfit,
  unlockedOutfits,
  wornOutfit,
} from "@/lib/tg-app/panda";
import { blitzShareText, duelNotice } from "@/lib/tg-app/texts";

vi.mock("server-only", () => ({}));

const client = new PGlite();
const testDb = drizzle(client, { schema });
vi.mock("@/db", () => ({ db: testDb }));
vi.mock("@/lib/content", () => ({
  getCourse: () => undefined,
  getLanguage: (slug: string) => ({ slug, name: slug }),
}));
vi.mock("@/lib/practice", () => ({
  getPracticeLanguages: () => [],
  getProblems: () => [],
  getDailyCandidates: () => [],
}));
const quiz = (n: number) => ({
  question: `Q${n}?`,
  options: ["a", "b", "c"],
  answer: n % 3,
  explanation: `Because ${n}.`,
});
vi.mock("@/lib/daily-feed", () => ({
  // 12 Python quizzes and 3 SQL ones.
  getPollQuizzes: () => [
    ...Array.from({ length: 12 }, (_, n) => ({
      permalink: `/learn/python/lesson-${n}`,
      en: quiz(n),
      ru: { ...quiz(n), question: `В${n}?` },
    })),
    ...Array.from({ length: 3 }, (_, n) => ({
      permalink: `/learn/sql/lesson-${n}`,
      en: quiz(n),
      ru: quiz(n),
    })),
  ],
}));

const blitz = await import("@/lib/tg-app/blitz");
const duels = await import("@/lib/tg-app/duel");
type Player = import("@/lib/tg-app/blitz").Player;

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

const TOKEN = "123456:test-token";

describe("signed launch data", () => {
  const now = Date.parse("2026-10-17T10:00:00Z");
  const fields = {
    auth_date: String(now / 1000 - 60),
    query_id: "AAH",
    user: JSON.stringify({ id: 42, first_name: "Mei", language_code: "ru" }),
    start_param: "blitz_python",
  };

  it("accepts what Telegram signed", () => {
    const init = validateInitData(signInitData(fields, TOKEN), TOKEN, now);
    expect(init).toMatchObject({
      user: { id: 42, first_name: "Mei" },
      startParam: "blitz_python",
    });
  });

  it("refuses a changed field, another bot's data, or an old launch", () => {
    const signed = signInitData(fields, TOKEN);
    const forged = signed.replace("%22id%22%3A42", "%22id%22%3A43");
    expect(forged).not.toBe(signed);
    expect(validateInitData(forged, TOKEN, now)).toBeNull();
    expect(validateInitData(signed, "999:other", now)).toBeNull();
    expect(
      validateInitData(signed, TOKEN, now + 2 * 24 * 3_600_000),
    ).toBeNull();
    expect(validateInitData("", TOKEN, now)).toBeNull();
    expect(validateInitData("user=%7B%7D&hash=zz", TOKEN, now)).toBeNull();
  });
});

describe("the panda", () => {
  it("grows with the level and follows today's practice", () => {
    expect([1, 2, 4, 7, 20].map(pandaStage)).toEqual([1, 2, 3, 4, 4]);
    const day = { streak: 3, todayXp: 0, dailyGoal: 50, activeToday: false };
    expect(pandaMood(day)).toBe("worried");
    expect(pandaMood({ ...day, streak: 0 })).toBe("sleepy");
    expect(pandaMood({ ...day, activeToday: true, todayXp: 10 })).toBe("happy");
    expect(pandaMood({ ...day, activeToday: true, todayXp: 50 })).toBe("proud");
  });

  it("wears the best unlocked things unless the learner picked others", () => {
    const unlocked = unlockedOutfits([
      "streak-3",
      "xp-500",
      "first-exercise",
      "first-lesson",
    ]);
    expect(unlocked).toEqual(["crown", "headband", "glasses"]);
    expect(wornOutfit(unlocked)).toEqual({ head: "crown", face: "glasses" });
    expect(wornOutfit(unlocked, { head: "headband" })).toMatchObject({
      head: "headband",
    });
    // Taken off on purpose stays off; locked or misplaced picks are ignored.
    expect(wornOutfit(unlocked, parseOutfit('{"face":null}')).face).toBe(
      undefined,
    );
    expect(wornOutfit(unlocked, { head: "cap" }).head).toBe("crown");
    expect(parseOutfit('{"head":"glasses","neck":"<script>"}')).toEqual({});
    expect(parseOutfit("not json")).toEqual({});
  });

  it("draws an SVG with what it wears", () => {
    const svg = pandaSvg({
      stage: 2,
      mood: "proud",
      outfit: { head: "crown" },
    });
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("#fcd34d");
    expect(svg).toContain("scale(0.8)");
  });
});

describe("share pictures", () => {
  it("round-trips a card through its URL", () => {
    const card = {
      kind: "blitz" as const,
      locale: "ru" as const,
      format: "wide" as const,
      number: 3,
      language: "python",
      grid: [true, false, true],
      seconds: 41,
    };
    expect(parseCard(new URLSearchParams(cardQuery(card)))).toEqual(card);
  });

  it("refuses anything but numbers and known names", () => {
    const bad = [
      "k=blitz&l=en&n=3&lang=cobol&g=1&t=4",
      "k=blitz&l=en&n=3&lang=sql&g=1&t=400",
      "k=blitz&l=en&n=3&lang=sql&g=hello&t=4",
      "k=panda&l=en&s=9&m=happy&lv=1&st=0",
      "k=panda&l=en&s=1&m=evil&lv=1&st=0",
      "k=panda&l=en&s=1&m=happy&lv=1&st=0&o=hat",
      "k=blitz&l=fr&n=3&lang=sql&g=1&t=4",
      "k=text&l=en",
    ];
    for (const q of bad) expect(parseCard(new URLSearchParams(q))).toBeNull();
  });

  it("writes the result to share as an emoji grid", () => {
    expect(
      blitzShareText("en", {
        number: 3,
        language: "python",
        grid: [true, false, true],
        size: 5,
        ms: 41_200,
      }),
    ).toBe("⚡ PandaDev Blitz #3 · Python\n🟩🟥🟩⬜⬜\n2/5 · 41 s");
    expect(
      blitzShareText("ru", {
        number: 3,
        language: "sql",
        grid: [true],
        size: 1,
        ms: 9000,
      }),
    ).toContain("1/1 · 9 с");
  });
});

describe("the Daily Blitz", () => {
  const start = new Date("2026-10-17T07:00:00Z"); // 12:00 in Tashkent
  const at = (seconds: number) => new Date(start.getTime() + seconds * 1000);
  const mei = { telegramId: 1, userId: "u1", locale: "en" as const };
  const bao = { telegramId: 2, userId: null, locale: "ru" as const };
  const answers = blitz
    .blitzQuestions("2026-10-17", "python")
    .map((q) => q.en.answer);

  beforeEach(async () => {
    await client.exec(`TRUNCATE "user", tg_blitz CASCADE`);
    await testDb
      .insert(schema.user)
      .values({ id: "u1", name: "Mei Lin", email: "mei@pandadev.test" });
  });

  async function play(player: Player, rightAnswers: number, secondsEach = 2) {
    await blitz.startBlitz(player, "python", start);
    for (let i = 0; i < answers.length; i++) {
      const choice = i < rightAnswers ? answers[i] : (answers[i] + 1) % 3;
      await blitz.answerBlitz(
        player,
        "python",
        i,
        choice,
        at((i + 1) * secondsEach),
      );
    }
  }

  it("gives everyone the same ten questions a day, without answers", async () => {
    const a = blitz.blitzQuestions("2026-10-17", "python");
    expect(a).toHaveLength(10);
    expect(new Set(a.map((q) => q.permalink)).size).toBe(10);
    expect(blitz.blitzQuestions("2026-10-17", "python")).toEqual(a);
    expect(blitz.blitzQuestions("2026-10-18", "python")).not.toEqual(a);
    const started = await blitz.startBlitz(bao, "python", start);
    expect(started?.number).toBe(1);
    expect(started?.questions[0].question).toMatch(/^В\d+\?$/);
    expect(JSON.stringify(started)).not.toContain('"answer"');
    expect(JSON.stringify(started)).not.toContain("Because");
    expect(await blitz.startBlitz(bao, "cobol", start)).toBeNull();
  });

  it("grades on the server, in order, once per question", async () => {
    await blitz.startBlitz(mei, "python", start);
    expect(await blitz.answerBlitz(mei, "python", 1, 0, at(1))).toBeNull(); // skipping ahead
    const first = await blitz.answerBlitz(mei, "python", 0, answers[0], at(2));
    expect(first).toEqual({
      counted: true,
      correct: true,
      answer: answers[0],
      done: false,
    });
    expect(await blitz.answerBlitz(mei, "python", 0, 1, at(3))).toBeNull();
  });

  it("pays XP once a day and ranks by score, then time", async () => {
    await play(mei, 8);
    const result = await blitz.blitzResult(mei, "python", at(30));
    expect(result).toMatchObject({
      score: 8,
      xp: 16,
      paid: 16,
      rank: 1,
      total: 1,
    });
    expect(result?.grid.filter(Boolean)).toHaveLength(8);
    expect(result?.review[9].explanation).toMatch(/^Because/);
    // Asking again doesn't pay again.
    expect((await blitz.blitzResult(mei, "python", at(31)))?.paid).toBe(0);
    const xp = await testDb.select().from(schema.xpEvent);
    expect(xp).toEqual([
      expect.objectContaining({
        reason: "blitz",
        amount: 16,
        ref: "blitz:2026-10-17",
      }),
    ]);

    // A guest: ranked, no XP, no name.
    await play(bao, 8, 1);
    const guest = await blitz.blitzResult(bao, "python", at(30));
    expect(guest).toMatchObject({ score: 8, xp: 0, rank: 1, total: 2 });
    expect(guest?.top.map((t) => t.you)).toEqual([true, false]);
    expect(guest?.top.every((t) => t.name === null)).toBe(true);
  });

  it("shows names only for learners who opted in to rankings", async () => {
    await testDb.insert(schema.telegramLink).values({
      userId: "u1",
      telegramId: 1,
      locale: "en",
      timeZone: "UTC",
      leaderboard: true,
    });
    await play(mei, 5);
    const result = await blitz.blitzResult(mei, "python", at(30));
    expect(result?.top[0]).toMatchObject({ name: "Mei L.", you: true });
  });

  it("ends a Blitz when the minute is up", async () => {
    await blitz.startBlitz(mei, "python", start);
    await blitz.answerBlitz(mei, "python", 0, answers[0], at(5));
    // Still playing a moment after the minute (slack for the network)…
    expect(await blitz.blitzResult(mei, "python", at(61))).toBeNull();
    // …then late answers don't count and the Blitz is over.
    expect(
      await blitz.answerBlitz(mei, "python", 1, answers[1], at(70)),
    ).toEqual({
      counted: false,
      done: true,
    });
    const result = await blitz.blitzResult(mei, "python", at(70));
    expect(result).toMatchObject({ score: 1, ms: 5000 });
    expect((await blitz.startBlitz(mei, "python", at(80)))?.done).toBe(true);
  });

  it("lists today's Blitz per language for the home screen", async () => {
    await play(mei, 10);
    await blitz.blitzResult(mei, "python", at(30));
    const overview = await blitz.blitzOverview(mei, at(40));
    expect(overview.xpLeft).toBe(false);
    expect(overview.languages).toEqual([
      { language: "python", status: "done", score: 10 },
      { language: "javascript", status: "new", score: null },
      { language: "typescript", status: "new", score: null },
      { language: "sql", status: "new", score: null },
    ]);
  });
});

describe("duels", () => {
  const start = new Date("2026-10-17T07:00:00Z");
  const at = (seconds: number) => new Date(start.getTime() + seconds * 1000);
  const anora = { telegramId: 10, userId: "u1", locale: "en" as const };
  const mei = { telegramId: 20, userId: "u2", locale: "ru" as const };
  const guest = { telegramId: 30, userId: null, locale: "en" as const };

  beforeEach(async () => {
    await client.exec(`TRUNCATE "user", tg_duel CASCADE`);
    await testDb.insert(schema.user).values([
      { id: "u1", name: "Anora", email: "a@pandadev.test" },
      { id: "u2", name: "Mei", email: "m@pandadev.test" },
    ]);
  });

  /** The right answers of a duel (the mock's quiz n has answer n % 3). */
  async function answersOf(id: string) {
    const [duel] = await testDb
      .select()
      .from(schema.tgDuel)
      .where(eq(schema.tgDuel.id, id));
    return duel.refs.map((ref) => Number(/lesson-(\d+)/.exec(ref)![1]) % 3);
  }

  async function play(
    player: Player,
    name: string,
    id: string,
    right: number,
    from = 0,
    secondsEach = 2,
  ) {
    const answers = await answersOf(id);
    const started = await duels.startDuel(player, name, id, at(from));
    if (!started || "expired" in started) throw new Error("not started");
    for (let i = 0; i < answers.length; i++) {
      const choice = i < right ? answers[i] : (answers[i] + 1) % 3;
      await duels.answerDuel(
        player,
        id,
        i,
        choice,
        at(from + (i + 1) * secondsEach),
      );
    }
    return duels.duelResult(player, id, at(from + 20));
  }

  async function challenge(right: number, secondsEach = 2) {
    const created = await duels.createDuel(anora, "Anora", "python", start);
    const id = (created as { id: string }).id;
    await play(anora, "Anora", id, right, 0, secondsEach);
    return id;
  }

  it("starts a challenge of five different questions, played first by the challenger", async () => {
    const created = await duels.createDuel(anora, "Anora", "python", start);
    const id = (created as { id: string }).id;
    const refs = (await testDb.select().from(schema.tgDuel))[0].refs;
    expect(new Set(refs).size).toBe(5);
    // Nobody else can play before the challenger has.
    expect(await duels.startDuel(mei, "Mei", id, at(1))).toBeNull();
    const result = await play(anora, "Anora", id, 4);
    expect(result).toMatchObject({
      yours: true,
      score: 4,
      xp: 5,
      outcome: null,
    });
    const info = await duels.duelInfo(mei, id, at(30));
    expect(info).toMatchObject({
      challenger: "Anora",
      yours: false,
      played: false,
      expired: false,
      toBeat: { score: 4, ms: 10_000 },
    });
    expect(await duels.createDuel(anora, "Anora", "cobol", start)).toBeNull();
  });

  it("shows the questions in the player's language, without answers", async () => {
    const id = await challenge(3);
    const started = await duels.startDuel(mei, "Mei", id, at(30));
    if (!started || !("questions" in started)) throw new Error("not started");
    expect(started.questions?.[0].question).toMatch(/^В\d+\?$/);
    expect(JSON.stringify(started)).not.toContain('"answer"');
  });

  it("pays +5 and +5 for beating the challenger, and tells them once", async () => {
    const id = await challenge(3);
    const result = await play(mei, "Mei", id, 5, 30, 1);
    expect(result).toMatchObject({
      outcome: "won",
      xp: 10,
      toBeat: { score: 3 },
      notify: { telegramId: 10, locale: "en", challengerBonus: false },
    });
    expect(result?.ranking.map((r) => [r.name, r.challenger])).toEqual([
      ["Mei", false],
      ["Anora", true],
    ]);
    // Asking again: no more XP, no second message.
    const again = await duels.duelResult(mei, id, at(80));
    expect(again).toMatchObject({ xp: 10, paid: 0, notify: null });
  });

  it("gives the challenger the win bonus when a friend falls short", async () => {
    const id = await challenge(4);
    const result = await play(mei, "Mei", id, 2, 30);
    expect(result).toMatchObject({
      outcome: "lost",
      xp: 5,
      notify: { challengerBonus: true },
    });
    const events = await testDb.select().from(schema.xpEvent);
    expect(events.map((e) => [e.userId, e.ref, e.amount]).sort()).toEqual([
      ["u1", `duel-win:${id}`, 5],
      ["u1", `duel:${id}`, 5],
      ["u2", `duel:${id}`, 5],
    ]);
  });

  it("breaks ties by time", async () => {
    const id = await challenge(3, 3);
    expect((await play(mei, "Mei", id, 3, 30, 2))?.outcome).toBe("won");
  });

  it("pays XP for three duels a day, then they're just for fun", async () => {
    for (let i = 0; i < 4; i++) await challenge(2);
    const xp = await testDb.select().from(schema.xpEvent);
    expect(xp).toHaveLength(3);
  });

  it("lets guests play without XP", async () => {
    const id = await challenge(2);
    const result = await play(guest, "Bao", id, 5, 30);
    expect(result).toMatchObject({ outcome: "won", xp: 0 });
  });

  it("doesn't count answers after the time is up", async () => {
    const id = await challenge(5);
    await duels.startDuel(mei, "Mei", id, at(30));
    expect(await duels.answerDuel(mei, id, 0, 0, at(30 + 40))).toEqual({
      counted: false,
      done: true,
    });
    expect(await duels.duelResult(mei, id, at(80))).toMatchObject({
      score: 0,
      outcome: "lost",
    });
  });

  it("closes to newcomers after 48 hours", async () => {
    const id = await challenge(3);
    const late = new Date(start.getTime() + 49 * 3_600_000);
    expect(await duels.startDuel(mei, "Mei", id, late)).toEqual({
      expired: true,
    });
    expect((await duels.duelInfo(mei, id, late))?.expired).toBe(true);
  });

  it("lists the player's recent duels", async () => {
    const id = await challenge(3);
    await play(mei, "Mei", id, 4, 30);
    expect(await duels.recentDuels(mei)).toEqual([
      {
        id,
        language: "python",
        challenger: "Anora",
        yours: false,
        score: 4,
        players: 2,
      },
    ]);
  });

  it("writes the bot's message to the challenger in their language", () => {
    const base = {
      name: "Mei",
      language: "python",
      size: 5,
      them: { score: 5, ms: 12_000 },
      you: { score: 4, ms: 18_000 },
    };
    expect(duelNotice("en", { ...base, theyWon: true, bonus: false })).toBe(
      "⚔️ Mei played your Python duel: 5/5 in 12 s vs your 4/5 in 18 s.\nMei wins. Rematch?",
    );
    expect(
      duelNotice("ru", { ...base, theyWon: false, bonus: true }),
    ).toContain("Вы удержали победу! +5 XP");
  });

  it("draws duel pictures only from sensible numbers", () => {
    const ok = "k=duel&l=en&n=1&lang=python&g=11010&t=18";
    expect(parseCard(new URLSearchParams(ok))).toMatchObject({
      kind: "duel",
      grid: [true, true, false, true, false],
    });
    expect(
      parseCard(
        new URLSearchParams("k=duel&l=en&n=1&lang=python&g=110101&t=18"),
      ),
    ).toBeNull();
    expect(
      parseCard(new URLSearchParams("k=duel&l=en&n=1&lang=python&g=1&t=45")),
    ).toBeNull();
  });
});
