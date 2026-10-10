import "server-only";

import { count, countDistinct, gte, sql, sum } from "drizzle-orm";

import { db } from "@/db";
import {
  learnerProfile,
  lessonProgress,
  telegramLink,
  user,
  xpEvent,
} from "@/db/schema";

/**
 * The site owner's admin panel: who may open it (ADMIN_EMAILS, comma
 * separated) and the numbers it shows. Everything here is read-only.
 */
export function isAdmin(email?: string | null) {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

const DAY = 86_400_000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** The last `days` UTC days, oldest first, with a value for each. */
function series(rows: { day: string; value: number }[], days: number) {
  const byDay = new Map(rows.map((r) => [r.day, r.value]));
  const today = Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate(),
  );
  return Array.from({ length: days }, (_, i) => {
    const day = dayKey(new Date(today - (days - 1 - i) * DAY));
    return { day, value: byDay.get(day) ?? 0 };
  });
}

const utcDay = (column: typeof user.createdAt | typeof xpEvent.createdAt) =>
  sql<string>`to_char(${column}, 'YYYY-MM-DD')`;

const solvedProblem = sql`${xpEvent.ref} like '/practice/%#exercise-1'`;

export async function getAdminOverview(days = 30) {
  const since = new Date(Date.now() - days * DAY);
  const now = Date.now();
  const ago = (n: number) => new Date(now - n * DAY);

  const [
    [users],
    [newUsers7],
    [newUsers30],
    [active1],
    [active7],
    [active30],
    [totals],
    [lessons],
    [problems],
    [profiles],
    [started],
    [returned],
    [stayed],
    signups,
    activity,
    lessonLanguages,
    problemLanguages,
    chosenLanguages,
    [telegram],
  ] = await Promise.all([
    db.select({ n: count() }).from(user),
    db
      .select({ n: count() })
      .from(user)
      .where(gte(user.createdAt, ago(7))),
    db
      .select({ n: count() })
      .from(user)
      .where(gte(user.createdAt, ago(30))),
    db
      .select({ n: countDistinct(xpEvent.userId) })
      .from(xpEvent)
      .where(gte(xpEvent.createdAt, ago(1))),
    db
      .select({ n: countDistinct(xpEvent.userId) })
      .from(xpEvent)
      .where(gte(xpEvent.createdAt, ago(7))),
    db
      .select({ n: countDistinct(xpEvent.userId) })
      .from(xpEvent)
      .where(gte(xpEvent.createdAt, ago(30))),
    db.select({ xp: sum(xpEvent.amount) }).from(xpEvent),
    db.select({ n: count() }).from(lessonProgress),
    db.select({ n: count() }).from(xpEvent).where(solvedProblem),
    // The journey: signed up → welcome steps → first XP → a second day →
    // still learning a week after signing up.
    db.select({ n: count() }).from(learnerProfile),
    db.select({ n: countDistinct(xpEvent.userId) }).from(xpEvent),
    db.select({ n: count() }).from(
      db
        .select({ id: xpEvent.userId })
        .from(xpEvent)
        .groupBy(xpEvent.userId)
        .having(sql`count(distinct ${utcDay(xpEvent.createdAt)}) >= 2`)
        .as("returned"),
    ),
    db
      .select({ n: countDistinct(xpEvent.userId) })
      .from(xpEvent)
      .innerJoin(user, sql`${user.id} = ${xpEvent.userId}`)
      .where(
        sql`${xpEvent.createdAt} >= ${user.createdAt} + interval '7 days'`,
      ),
    db
      .select({ day: utcDay(user.createdAt), value: count() })
      .from(user)
      .where(gte(user.createdAt, since))
      .groupBy(sql`1`),
    db
      .select({
        day: utcDay(xpEvent.createdAt),
        learners: countDistinct(xpEvent.userId),
        xp: sum(xpEvent.amount),
      })
      .from(xpEvent)
      .where(gte(xpEvent.createdAt, since))
      .groupBy(sql`1`),
    db
      .select({ language: lessonProgress.language, n: count() })
      .from(lessonProgress)
      .groupBy(lessonProgress.language),
    db
      .select({
        language: sql<string>`split_part(${xpEvent.ref}, '/', 3)`,
        n: count(),
      })
      .from(xpEvent)
      .where(solvedProblem)
      .groupBy(sql`1`),
    db
      .select({ language: learnerProfile.language, n: count() })
      .from(learnerProfile)
      .groupBy(learnerProfile.language),
    db
      .select({
        linked: count(),
        reminders: sql<number>`count(*) filter (where ${telegramLink.reminders})`,
        leaderboard: sql<number>`count(*) filter (where ${telegramLink.leaderboard})`,
        ru: sql<number>`count(*) filter (where ${telegramLink.locale} = 'ru')`,
      })
      .from(telegramLink),
  ]);

  const languages = new Map<
    string,
    { lessons: number; problems: number; chosen: number }
  >();
  const add = (
    rows: { language: string; n: number }[],
    key: "lessons" | "problems" | "chosen",
  ) => {
    for (const r of rows) {
      const entry = languages.get(r.language) ?? {
        lessons: 0,
        problems: 0,
        chosen: 0,
      };
      entry[key] += Number(r.n);
      languages.set(r.language, entry);
    }
  };
  add(lessonLanguages, "lessons");
  add(problemLanguages, "problems");
  add(chosenLanguages, "chosen");

  return {
    learners: {
      total: users.n,
      new7: newUsers7.n,
      new30: newUsers30.n,
      active1: active1.n,
      active7: active7.n,
      active30: active30.n,
    },
    totals: {
      xp: Number(totals.xp ?? 0),
      lessons: lessons.n,
      problems: problems.n,
    },
    funnel: [
      { step: "signedUp", n: users.n },
      { step: "welcome", n: profiles.n },
      { step: "firstXp", n: started.n },
      { step: "secondDay", n: returned.n },
      { step: "weekLater", n: stayed.n },
    ] as const,
    signups: series(
      signups.map((r) => ({ day: r.day, value: Number(r.value) })),
      days,
    ),
    activeLearners: series(
      activity.map((r) => ({ day: r.day, value: Number(r.learners) })),
      days,
    ),
    xpPerDay: series(
      activity.map((r) => ({ day: r.day, value: Number(r.xp ?? 0) })),
      days,
    ),
    languages: [...languages]
      .map(([language, n]) => ({ language, ...n }))
      .sort((a, b) => b.lessons + b.problems - (a.lessons + a.problems)),
    telegram: {
      linked: telegram.linked,
      reminders: Number(telegram.reminders),
      leaderboard: Number(telegram.leaderboard),
      ru: Number(telegram.ru),
    },
  };
}

export type AdminOverview = Awaited<ReturnType<typeof getAdminOverview>>;

/** The database's size and its biggest tables, against Neon's free 0.5 GB. */
export async function getDatabaseInfo() {
  const [size] = (
    await db.execute(
      sql`select pg_database_size(current_database())::bigint as bytes`,
    )
  ).rows as { bytes: string | number }[];
  const tables = (
    await db.execute(sql`
      select relname as name, n_live_tup::bigint as rows
      from pg_stat_user_tables
      order by n_live_tup desc
      limit 8`)
  ).rows as { name: string; rows: string | number }[];
  return {
    bytes: Number(size?.bytes ?? 0),
    limitBytes: 512 * 1024 * 1024,
    tables: tables.map((t) => ({ name: t.name, rows: Number(t.rows) })),
  };
}
