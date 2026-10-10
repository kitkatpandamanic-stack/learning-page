/**
 * Bookmarks, "continue" and daily review against a real PostgreSQL (PGlite)
 * with the app's migrations, and a small made-up course instead of the content.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as schema from "@/db/schema";

vi.mock("server-only", () => ({}));

const client = new PGlite();
const testDb = drizzle(client, { schema });
vi.mock("@/db", () => ({ db: testDb }));

const quiz = (n: number, answer = 0) => ({
  question: `Question ${n}?`,
  options: ["right", "wrong"],
  answer,
});
const lesson = (slug: string, quizzes: ReturnType<typeof quiz>[]) => ({
  slug,
  permalink: `/learn/python/${slug}`,
  title: `Lesson ${slug}`,
  description: "",
  quizzes,
});
const course = {
  levels: [
    {
      modules: [
        {
          title: "Basics",
          lessons: [
            lesson("one", [quiz(1), quiz(2, 1)]),
            lesson("two", []),
            lesson(
              "three",
              Array.from({ length: 7 }, (_, i) => quiz(10 + i)),
            ),
          ],
        },
      ],
    },
    { modules: [{ title: "Next steps", lessons: [lesson("four", [])] }] },
  ],
};
vi.mock("@/lib/content", () => ({
  getCourse: (language: string) => (language === "python" ? course : undefined),
}));
vi.mock("@/lib/practice", () => ({
  getPracticeLanguages: () => ["sql"],
  getProblems: () =>
    ["a", "b", "c"].map((slug) => ({
      slug,
      permalink: `/practice/sql/${slug}`,
      title: `Problem ${slug}`,
      description: "",
      difficulty: "easy",
    })),
}));

const learning = await import("@/lib/learning");
const savedCode = await import("@/lib/saved-code");
const profiles = await import("@/lib/learner-profile");
const { awardXp, markLessonComplete, todayIn } = await import("@/lib/progress");
const { addDays, REVIEW_XP } = await import("@/lib/review-schedule");

const dir = join(__dirname, "..", "..", "drizzle");
for (const file of readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort()) {
  for (const statement of readFileSync(join(dir, file), "utf8").split(
    "--> statement-breakpoint",
  )) {
    await client.exec(statement);
  }
}

const userId = "u1";
const tz = "UTC";
const today = todayIn(tz);

beforeEach(async () => {
  await client.exec(`TRUNCATE "user" CASCADE`);
  await testDb
    .insert(schema.user)
    .values({ id: userId, name: "Mei", email: "mei@pandadev.test" });
});

describe("bookmarks", () => {
  it("saves once, lists newest first and removes", async () => {
    await learning.setBookmark(userId, "/learn/python/one", true);
    await learning.setBookmark(userId, "/learn/python/one", true);
    await learning.setBookmark(userId, "/practice/sql/b", true);
    await learning.setBookmark(userId, "/learn/python/gone", true);
    const saved = await learning.getSavedPages(userId, "en");
    expect(saved.map((p) => p.title)).toEqual(["Problem b", "Lesson one"]);

    await learning.setBookmark(userId, "/practice/sql/b", false);
    expect(
      (await learning.listBookmarks(userId)).map((b) => b.permalink).sort(),
    ).toEqual(["/learn/python/gone", "/learn/python/one"]);
  });

  it("knows which pages exist", () => {
    expect(learning.isPage("/learn/python/two")).toBe(true);
    expect(learning.isPage("/practice/sql/c")).toBe(true);
    expect(learning.isPage("/learn/python/nope")).toBe(false);
  });
});

describe("continue where you left off", () => {
  const target = async () => (await learning.getContinue(userId, "en")).target;

  it("starts at the first lesson with no history", async () => {
    expect(await target()).toMatchObject({
      permalink: "/learn/python/one",
      reason: "start",
    });
  });

  it("resumes the last page opened until it's finished, then moves on", async () => {
    await learning.recordVisit(userId, "/learn/python/one");
    // Visits a moment apart, as in real life (timestamps have no tie-breaker).
    await new Promise((resolve) => setTimeout(resolve, 5));
    await learning.recordVisit(userId, "/learn/python/two");
    expect(await target()).toMatchObject({
      permalink: "/learn/python/two",
      reason: "resume",
    });

    await markLessonComplete(userId, "python", "two");
    expect(await target()).toMatchObject({
      permalink: "/learn/python/three",
      reason: "next",
    });

    const { recent } = await learning.getContinue(userId, "en");
    expect(recent.map((p) => p.permalink)).toEqual([
      "/learn/python/two",
      "/learn/python/one",
    ]);
  });

  it("goes to the next unsolved problem after a solved one", async () => {
    await awardXp(userId, "exercise", "/practice/sql/a#exercise-1", 10);
    await awardXp(userId, "exercise", "/practice/sql/b#exercise-1", 10);
    await learning.recordVisit(userId, "/practice/sql/a");
    expect(await target()).toMatchObject({
      permalink: "/practice/sql/c",
      reason: "next",
    });
  });
});

describe("daily review", () => {
  const session = () => learning.getReviewSession(userId, tz, "en");

  it("is empty until a lesson with quizzes is finished", async () => {
    await markLessonComplete(userId, "python", "two");
    expect(await session()).toMatchObject({
      questions: [],
      waiting: 0,
      deckSize: 0,
    });
  });

  it("schedules answers and pays XP once when the day's review is done", async () => {
    await markLessonComplete(userId, "python", "one");
    const first = await session();
    expect(first.questions.map((q) => q.ref)).toEqual([
      "/learn/python/one#quiz-1",
      "/learn/python/one#quiz-2",
    ]);
    expect(first.questions.every((q) => q.isNew)).toBe(true);

    const right = await learning.answerReview(
      userId,
      tz,
      "/learn/python/one#quiz-1",
      0,
    );
    expect(right).toEqual({
      correct: true,
      answer: 0,
      finished: false,
      xpAwarded: 0,
    });
    const wrong = await learning.answerReview(
      userId,
      tz,
      "/learn/python/one#quiz-2",
      0,
    );
    expect(wrong).toEqual({
      correct: false,
      answer: 1,
      finished: true,
      xpAwarded: REVIEW_XP,
    });

    const cards = await testDb.select().from(schema.reviewCard);
    expect(
      cards.map((c) => [c.ref.split("#")[1], c.box, c.dueOn]).sort(),
    ).toEqual([
      ["quiz-1", 1, addDays(today, 1)],
      ["quiz-2", 0, addDays(today, 1)],
    ]);

    // Done for today: nothing waiting, no second payout, a repeat answer changes nothing.
    expect(await session()).toMatchObject({ questions: [], doneToday: true });
    const again = await learning.answerReview(
      userId,
      tz,
      "/learn/python/one#quiz-1",
      1,
    );
    expect(again).toMatchObject({ correct: false, xpAwarded: 0 });
    const [card] = await testDb
      .select()
      .from(schema.reviewCard)
      .where(
        (await import("drizzle-orm")).eq(
          schema.reviewCard.ref,
          "/learn/python/one#quiz-1",
        ),
      );
    expect(card.box).toBe(1);
  });

  it("introduces at most five new questions a day", async () => {
    await markLessonComplete(userId, "python", "three");
    expect((await session()).questions).toHaveLength(5);
  });

  it("refuses questions from unfinished lessons and unknown ones", async () => {
    expect(
      await learning.answerReview(userId, tz, "/learn/python/one#quiz-1", 0),
    ).toBeNull();
    await markLessonComplete(userId, "python", "one");
    expect(
      await learning.answerReview(userId, tz, "/learn/python/one#quiz-9", 0),
    ).toBeNull();
    expect(
      await learning.answerReview(userId, tz, "/learn/python/one", 0),
    ).toBeNull();
  });
});

describe("saved code", () => {
  const key = savedCode.codeKey("en", "/learn/python/one", "exercise-1")!;
  const load = () => savedCode.getSavedCode(userId, "en", "/learn/python/one");

  it("only accepts real pages, locales and editors", () => {
    expect(key).toBe("en:/learn/python/one#exercise-1");
    expect(savedCode.codeKey("ru", "/playground", "playground-python")).toBe(
      "ru:/playground#playground-python",
    );
    expect(
      savedCode.codeKey("de", "/learn/python/one", "exercise-1"),
    ).toBeNull();
    expect(
      savedCode.codeKey("en", "/learn/python/nope", "exercise-1"),
    ).toBeNull();
    expect(savedCode.codeKey("en", "/learn/python/one", "quiz-1")).toBeNull();
  });

  it("saves, updates and resets an editor's code for its page only", async () => {
    expect(await savedCode.putSavedCode(userId, key, "print(1)", 1000)).toBe(
      true,
    );
    await savedCode.putSavedCode(
      userId,
      savedCode.codeKey("en", "/learn/python/two", "exercise-1")!,
      "other page",
      1000,
    );
    expect(await load()).toEqual({
      "exercise-1": { code: "print(1)", editedAt: 1000 },
    });

    await savedCode.putSavedCode(userId, key, "print(2)", 2000);
    expect((await load())["exercise-1"].code).toBe("print(2)");

    // A reset is kept (code null), so other devices learn about it.
    await savedCode.putSavedCode(userId, key, null, 3000);
    expect(await load()).toEqual({
      "exercise-1": { code: null, editedAt: 3000 },
    });
  });

  it("ignores an older edit arriving late from an offline device", async () => {
    await savedCode.putSavedCode(userId, key, "newer", 5000);
    await savedCode.putSavedCode(userId, key, "older", 4000);
    expect((await load())["exercise-1"]).toEqual({
      code: "newer",
      editedAt: 5000,
    });
  });

  it("refuses code that is too long, and clamps edits from the future", async () => {
    expect(
      await savedCode.putSavedCode(userId, key, "x".repeat(100_001), 1000),
    ).toBe(false);
    await savedCode.putSavedCode(userId, key, "soon", Date.now() + 86_400_000);
    expect((await load())["exercise-1"].editedAt).toBeLessThanOrEqual(
      Date.now(),
    );
  });
});

describe("welcome steps", () => {
  it("saves and changes a learner's choices, refusing ones not offered", async () => {
    expect(await profiles.getLearnerProfile(userId)).toBeNull();
    const choice = { language: "python", level: 1, dailyGoal: 50 };
    expect(await profiles.saveLearnerProfile(userId, choice)).toBe(true);
    expect(await profiles.getLearnerProfile(userId)).toEqual(choice);

    await profiles.saveLearnerProfile(userId, { ...choice, dailyGoal: 100 });
    expect((await profiles.getLearnerProfile(userId))?.dailyGoal).toBe(100);

    for (const bad of [
      { ...choice, language: "cobol" },
      { ...choice, level: 3 },
      { ...choice, dailyGoal: 45 },
    ]) {
      expect(await profiles.saveLearnerProfile(userId, bad)).toBe(false);
    }
  });

  it("starts a new learner at the first lesson of the level they picked", async () => {
    expect(learning.startLesson("python", 1, "en")?.permalink).toBe(
      "/learn/python/four",
    );
    expect(learning.startLesson("python", 2, "en")).toBeUndefined();

    await profiles.saveLearnerProfile(userId, {
      language: "python",
      level: 1,
      dailyGoal: 30,
    });
    expect((await learning.getContinue(userId, "en")).target).toMatchObject({
      permalink: "/learn/python/four",
      reason: "start",
    });

    // Once they've opened something, "continue" follows them instead.
    await learning.recordVisit(userId, "/learn/python/two");
    expect((await learning.getContinue(userId, "en")).target).toMatchObject({
      permalink: "/learn/python/two",
      reason: "resume",
    });
  });
});
