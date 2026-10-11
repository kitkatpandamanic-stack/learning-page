import "server-only";

import { and, desc, gt, inArray, lt, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  account,
  healthSnapshot,
  lessonProgress,
  session,
  user,
  xpEvent,
} from "@/db/schema";
import { readSnapshot, type Snapshot } from "@/lib/health";

/** Database reads for /admin/health. Everything here is read-only. */

export async function getLatestSnapshot(): Promise<{
  collectedAt: Date | null;
  snapshot: Snapshot | null;
}> {
  const [row] = await db
    .select()
    .from(healthSnapshot)
    .orderBy(desc(healthSnapshot.collectedAt))
    .limit(1);
  return {
    collectedAt: row?.collectedAt ?? null,
    snapshot: row ? readSnapshot(row.data) : null,
  };
}

export async function saveSnapshot(snapshot: Snapshot) {
  await db.insert(healthSnapshot).values({ data: snapshot });
  // Three months of history is plenty.
  await db
    .delete(healthSnapshot)
    .where(
      lt(healthSnapshot.collectedAt, new Date(Date.now() - 90 * 86_400_000)),
    );
}

/**
 * Neon compute used on each of the last `days` UTC days, in CU-hours, from
 * the snapshots' running totals (which restart each billing period).
 */
export async function getComputePerDay(days = 30) {
  const since = new Date(Date.now() - (days + 1) * 86_400_000).toISOString();
  const rows = (
    await db.execute(sql`
      select to_char(${healthSnapshot.collectedAt}, 'YYYY-MM-DD') as day,
             max((${healthSnapshot.data}->'neon'->>'computeSeconds')::float) as total
      from ${healthSnapshot}
      where ${healthSnapshot.data}->'neon'->>'ok' = 'true'
        and ${healthSnapshot.collectedAt} > ${since}::timestamp
      group by 1
      order by 1`)
  ).rows as { day: string; total: number | string }[];
  const totals = rows.map((r) => ({ day: r.day, total: Number(r.total) }));
  return totals.slice(1).map((r, i) => {
    const before = totals[i].total;
    // A smaller total than the day before means a new period started.
    const seconds = r.total >= before ? r.total - before : r.total;
    return { day: r.day, value: Math.round((seconds / 3600) * 100) / 100 };
  });
}

export type SignalKey =
  | "signUps"
  | "signIns"
  | "activeLearners"
  | "lessonsFinished"
  | "problemsSolved";

/**
 * Each signal for the last 24 hours and on an average day of the 14 before.
 * Days are counted back from now ("0" = the last 24 hours), so the time of
 * day doesn't matter.
 */
export async function getLearnerSignals(): Promise<
  { key: SignalKey; last24h: number; dailyAverage: number }[]
> {
  const now = new Date().toISOString();
  const daysAgo = (column: unknown) =>
    sql<number>`floor(extract(epoch from (${now}::timestamp - ${column})) / 86400)::int`;
  const since = (column: unknown) =>
    sql`${column} > ${now}::timestamp - interval '15 days'`;

  const query = async (
    table: string,
    column: unknown,
    value: ReturnType<typeof sql>,
    where = sql`true`,
  ) =>
    (
      await db.execute(sql`
        select ${daysAgo(column)} as d, ${value} as n
        from ${sql.identifier(table)}
        where ${since(column)} and ${where}
        group by 1`)
    ).rows as { d: number; n: number | string }[];

  const results = await Promise.all([
    query("user", user.createdAt, sql`count(*)`),
    query("session", session.createdAt, sql`count(*)`),
    query(
      "xp_event",
      xpEvent.createdAt,
      sql`count(distinct ${xpEvent.userId})`,
    ),
    query("lesson_progress", lessonProgress.completedAt, sql`count(*)`),
    query(
      "xp_event",
      xpEvent.createdAt,
      sql`count(*)`,
      sql`${xpEvent.ref} like '/practice/%#exercise-1'`,
    ),
  ]);
  const keys: SignalKey[] = [
    "signUps",
    "signIns",
    "activeLearners",
    "lessonsFinished",
    "problemsSolved",
  ];
  return keys.map((key, i) => {
    const rows = results[i].map((r) => ({ d: Number(r.d), n: Number(r.n) }));
    const last24h = rows.find((r) => r.d === 0)?.n ?? 0;
    const before = rows
      .filter((r) => r.d >= 1 && r.d <= 14)
      .reduce((sum, r) => sum + r.n, 0);
    return { key, last24h, dailyAverage: Math.round((before / 14) * 10) / 10 };
  });
}

/**
 * Where the admins are signed in, and with which providers. Something you
 * don't recognise here means someone else got into an admin account.
 */
export async function getAdminAccess(adminEmails: string[]) {
  if (adminEmails.length === 0) return { sessions: [], providers: [] };
  const admins = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(inArray(sql`lower(${user.email})`, adminEmails));
  const ids = admins.map((a) => a.id);
  if (ids.length === 0) return { sessions: [], providers: [] };
  const [sessions, providers] = await Promise.all([
    db
      .select({
        id: session.id,
        userId: session.userId,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      })
      .from(session)
      .where(
        and(inArray(session.userId, ids), gt(session.expiresAt, new Date())),
      )
      .orderBy(desc(session.updatedAt))
      .limit(10),
    db
      .select({
        userId: account.userId,
        providerId: account.providerId,
        createdAt: account.createdAt,
      })
      .from(account)
      .where(inArray(account.userId, ids)),
  ]);
  const email = (id: string) => admins.find((a) => a.id === id)?.email ?? "";
  return {
    sessions: sessions.map((s) => ({
      id: s.id,
      email: email(s.userId),
      createdAt: s.createdAt.toISOString(),
      lastSeen: s.updatedAt.toISOString(),
      ip: s.ipAddress,
      userAgent: s.userAgent,
    })),
    providers: providers.map((p) => ({
      email: email(p.userId),
      provider: p.providerId,
      linkedAt: p.createdAt.toISOString(),
    })),
  };
}
