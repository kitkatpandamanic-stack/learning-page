/** The admin panel's numbers, against PGlite with the app's migrations. */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { beforeAll, describe, expect, it, vi } from "vitest";

import * as schema from "@/db/schema";

vi.mock("server-only", () => ({}));
const client = new PGlite();
const testDb = drizzle(client, { schema });
vi.mock("@/db", () => ({ db: testDb }));

const { getAdminOverview, getDatabaseInfo, isAdmin } =
  await import("@/lib/admin");

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

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

beforeAll(async () => {
  await testDb.insert(schema.user).values([
    // Signed up long ago, still learning: every step of the journey.
    { id: "a", name: "A", email: "a@x.test", createdAt: daysAgo(40) },
    // Signed up 3 days ago, did the welcome steps and one lesson.
    { id: "b", name: "B", email: "b@x.test", createdAt: daysAgo(3) },
    // Signed up today, nothing else.
    { id: "c", name: "C", email: "c@x.test", createdAt: daysAgo(0) },
  ]);
  await testDb.insert(schema.learnerProfile).values([
    { userId: "a", language: "python", level: 0, dailyGoal: 50 },
    { userId: "b", language: "sql", level: 1, dailyGoal: 30 },
  ]);
  await testDb.insert(schema.lessonProgress).values([
    { userId: "a", language: "python", lessonSlug: "loops" },
    { userId: "b", language: "sql", lessonSlug: "select" },
  ]);
  await testDb.insert(schema.xpEvent).values([
    {
      userId: "a",
      amount: 10,
      reason: "lesson",
      ref: "1",
      createdAt: daysAgo(39),
    },
    {
      userId: "a",
      amount: 20,
      reason: "exercise",
      ref: "/practice/python/count-vowels#exercise-1",
      createdAt: daysAgo(2),
    },
    {
      userId: "b",
      amount: 15,
      reason: "lesson",
      ref: "2",
      createdAt: daysAgo(1),
    },
  ]);
  await testDb.insert(schema.telegramLink).values({
    userId: "a",
    telegramId: 1,
    locale: "ru",
    timeZone: "UTC",
    reminders: true,
  });
});

describe("admin access", () => {
  it("is for the emails in ADMIN_EMAILS only", () => {
    vi.stubEnv("ADMIN_EMAILS", "owner@x.test, Other@X.test");
    expect(isAdmin("owner@x.test")).toBe(true);
    expect(isAdmin("other@x.test")).toBe(true);
    expect(isAdmin("someone@x.test")).toBe(false);
    expect(isAdmin(null)).toBe(false);
    vi.stubEnv("ADMIN_EMAILS", "");
    expect(isAdmin("owner@x.test")).toBe(false);
    vi.unstubAllEnvs();
  });
});

describe("admin overview", () => {
  it("counts learners, activity and the journey", async () => {
    const o = await getAdminOverview(30);
    expect(o.learners).toEqual({
      total: 3,
      new7: 2,
      new30: 2,
      active1: 0,
      active7: 2,
      active30: 2,
    });
    expect(o.totals).toEqual({ xp: 45, lessons: 2, problems: 1 });
    expect(o.funnel.map((s) => s.n)).toEqual([3, 2, 2, 1, 1]);
    expect(o.telegram).toEqual({
      linked: 1,
      reminders: 1,
      leaderboard: 0,
      ru: 1,
    });
  });

  it("gives one value per day and per language", async () => {
    const o = await getAdminOverview(30);
    expect(o.signups).toHaveLength(30);
    expect(o.signups.reduce((n, d) => n + d.value, 0)).toBe(2);
    expect(o.xpPerDay.reduce((n, d) => n + d.value, 0)).toBe(35);
    expect(o.languages).toEqual([
      { language: "python", lessons: 1, problems: 1, chosen: 1 },
      { language: "sql", lessons: 1, problems: 0, chosen: 1 },
    ]);
  });

  it("reports the database size", async () => {
    const info = await getDatabaseInfo();
    expect(info.bytes).toBeGreaterThan(0);
    expect(info.tables.length).toBeGreaterThan(0);
  });
});
