/** /admin/health's database reads, against PGlite with the app's migrations. */
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

const {
  getAdminAccess,
  getComputePerDay,
  getLatestSnapshot,
  getLearnerSignals,
  saveSnapshot,
} = await import("@/lib/health-data");
const { getSecurityEvents, pruneSecurityEvents } =
  await import("@/lib/security-events");

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

const hoursAgo = (n: number) => new Date(Date.now() - n * 3_600_000);
const daysAgo = (n: number) => hoursAgo(n * 24);

beforeAll(async () => {
  // A sign-up on each of the 14 days before today, and none today.
  await testDb.insert(schema.user).values([
    ...Array.from({ length: 14 }, (_, i) => ({
      id: `u${i}`,
      name: `U${i}`,
      email: `u${i}@x.test`,
      createdAt: hoursAgo(24 * (i + 1) + 1),
    })),
    {
      id: "admin",
      name: "Admin",
      email: "Admin@X.test",
      createdAt: daysAgo(100),
    },
  ]);
  // Two learners active in the last 24 hours, one problem solved.
  await testDb.insert(schema.xpEvent).values([
    {
      userId: "u1",
      amount: 10,
      reason: "lesson",
      ref: "a",
      createdAt: hoursAgo(2),
    },
    {
      userId: "u1",
      amount: 10,
      reason: "lesson",
      ref: "b",
      createdAt: hoursAgo(3),
    },
    {
      userId: "u2",
      amount: 20,
      reason: "exercise",
      ref: "/practice/sql/top-sellers#exercise-1",
      createdAt: hoursAgo(5),
    },
  ]);
  await testDb.insert(schema.session).values([
    {
      id: "s1",
      token: "t1",
      userId: "admin",
      expiresAt: daysAgo(-7),
      createdAt: daysAgo(1),
      updatedAt: hoursAgo(1),
      ipAddress: "203.0.113.7",
      userAgent: "Chrome/141 Macintosh",
    },
    // Expired: not shown
    {
      id: "s2",
      token: "t2",
      userId: "admin",
      expiresAt: daysAgo(1),
      createdAt: daysAgo(10),
      updatedAt: daysAgo(9),
    },
  ]);
  await testDb.insert(schema.account).values({
    id: "a1",
    accountId: "123",
    providerId: "github",
    userId: "admin",
    createdAt: daysAgo(100),
    updatedAt: daysAgo(100),
  });
});

describe("getLearnerSignals", () => {
  it("compares the last 24 hours with an average day", async () => {
    const signals = Object.fromEntries(
      (await getLearnerSignals()).map((s) => [s.key, s]),
    );
    expect(signals.signUps).toMatchObject({ last24h: 0, dailyAverage: 1 });
    expect(signals.activeLearners.last24h).toBe(2);
    expect(signals.problemsSolved.last24h).toBe(1);
    expect(signals.signIns.last24h).toBe(0);
  });
});

describe("snapshots", () => {
  it("returns the latest snapshot, read defensively", async () => {
    expect(await getLatestSnapshot()).toEqual({
      collectedAt: null,
      snapshot: null,
    });
    await saveSnapshot({
      version: 1,
      github: { ok: false, error: "HTTP 500" },
    });
    const latest = await getLatestSnapshot();
    expect(latest.collectedAt).toBeInstanceOf(Date);
    expect(latest.snapshot?.github).toEqual({ ok: false, error: "HTTP 500" });
  });

  it("turns running compute totals into compute per day", async () => {
    const neon = (seconds: number) => ({
      version: 1,
      neon: { ok: true, computeSeconds: seconds },
    });
    await testDb.insert(schema.healthSnapshot).values([
      { data: neon(3600), collectedAt: daysAgo(3) },
      { data: neon(5400), collectedAt: daysAgo(2) },
      // A new billing period started: the total restarts
      { data: neon(1800), collectedAt: daysAgo(1) },
    ]);
    const perDay = await getComputePerDay(30);
    expect(perDay.map((d) => d.value)).toEqual([0.5, 0.5]);
  });
});

describe("getAdminAccess", () => {
  it("lists the admins' live sessions and sign-in methods", async () => {
    const access = await getAdminAccess(["admin@x.test"]);
    expect(access.sessions).toEqual([
      expect.objectContaining({
        id: "s1",
        email: "Admin@X.test",
        ip: "203.0.113.7",
      }),
    ]);
    expect(access.providers).toEqual([
      expect.objectContaining({ provider: "github", email: "Admin@X.test" }),
    ]);
    expect(await getAdminAccess([])).toEqual({ sessions: [], providers: [] });
  });
});

describe("security events", () => {
  it("counts the last 24 hours by kind and forgets old ones", async () => {
    await testDb.insert(schema.securityEvent).values([
      {
        kind: "bad-secret",
        detail: "telegram-cron",
        who: "ip:1",
        createdAt: hoursAgo(1),
      },
      {
        kind: "bad-secret",
        detail: "telegram-cron",
        who: "ip:2",
        createdAt: hoursAgo(2),
      },
      {
        kind: "rate-limited",
        detail: "report",
        who: "u:u1",
        createdAt: daysAgo(3),
      },
      {
        kind: "spam-trap",
        detail: "report",
        who: "ip:3",
        createdAt: daysAgo(40),
      },
    ]);
    const events = await getSecurityEvents();
    expect(events.last24h["bad-secret"]).toEqual({ n: 2, people: 2 });
    expect(events.last24h["rate-limited"].n).toBe(0);
    expect(events.latest.map((e) => e.kind)).toEqual([
      "bad-secret",
      "bad-secret",
      "rate-limited",
    ]);
    await pruneSecurityEvents();
    const left = await testDb.select().from(schema.securityEvent);
    expect(left).toHaveLength(3);
  });
});
