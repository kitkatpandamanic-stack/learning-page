import "server-only";

import { cookies } from "next/headers";
import { and, count, desc, eq, or, sql, sum } from "drizzle-orm";

import { db } from "@/db";
import {
  account,
  lessonProgress,
  streakFreeze,
  userAchievement,
  xpEvent,
} from "@/db/schema";
import { getAllLessons, getCourse } from "@/lib/content";
import { getPracticeLanguages, getProblems } from "@/lib/practice";
import { defaultLocale, type Locale } from "@/lib/i18n";
import {
  achievements,
  computeStreaks,
  DAILY_GOAL_XP,
  levelFromXp,
  toInfo,
  type AchievementInfo,
  type AchievementStats,
  type XpReason,
} from "@/lib/gamification";
import { MAX_FREEZES, planFreezes } from "@/lib/daily";
import { languages } from "@/lib/languages";
import { getLearnerProfile } from "@/lib/learner-profile";
import { isValidTimeZone } from "@/lib/time-zone";

// ---------------------------------------------------------------------------
// Time zones: streaks and "today" use the learner's local day. The browser
// stores its time zone in a cookie (see TimeZoneCookie).
// ---------------------------------------------------------------------------

export async function getTimeZone() {
  const tz = (await cookies()).get("tz")?.value;
  return tz && isValidTimeZone(tz) ? tz : "UTC";
}

export function todayIn(tz: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
}

function addDays(day: string, n: number) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** created_at is stored in UTC; convert to the learner's calendar day. */
const localDay = (tz: string) =>
  sql<string>`to_char((${xpEvent.createdAt} AT TIME ZONE 'UTC') AT TIME ZONE ${tz}, 'YYYY-MM-DD')`;

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/** Inserts an XP event unless this exact activity was already rewarded. */
export async function awardXp(
  userId: string,
  reason: XpReason,
  ref: string,
  amount: number,
) {
  const rows = await db
    .insert(xpEvent)
    .values({ userId, reason, ref, amount })
    .onConflictDoNothing()
    .returning({ id: xpEvent.id });
  return rows.length > 0;
}

export async function markLessonComplete(
  userId: string,
  language: string,
  lessonSlug: string,
) {
  await db
    .insert(lessonProgress)
    .values({ userId, language, lessonSlug })
    .onConflictDoNothing();
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/**
 * Streak freezes, settled whenever the learner's data is loaded: covers days
 * just missed (if freezes are left) and awards one for every 7 days in a row.
 */
async function settleFreezes(userId: string, xpDays: string[], today: string) {
  const rows = await db
    .select({ kind: streakFreeze.kind, day: streakFreeze.day })
    .from(streakFreeze)
    .where(eq(streakFreeze.userId, userId));
  const used = rows.filter((r) => r.kind === "used").map((r) => r.day);
  const earned = rows.length - used.length;
  let available = Math.max(0, Math.min(MAX_FREEZES, earned - used.length));
  const plan = planFreezes({
    active: new Set([...xpDays, ...used]),
    today,
    available,
  });
  if (plan.fill.length > 0) {
    await db
      .insert(streakFreeze)
      .values(plan.fill.map((day) => ({ userId, kind: "used" as const, day })))
      .onConflictDoNothing();
    available -= plan.fill.length;
  }
  if (plan.earn) {
    const inserted = await db
      .insert(streakFreeze)
      .values({ userId, kind: "earned", day: today })
      .onConflictDoNothing()
      .returning({ day: streakFreeze.day });
    if (inserted.length) available++;
  }
  const frozen = [...used, ...plan.fill];
  return {
    frozen,
    available,
    /** The latest day a freeze covered (for "a freeze saved your streak") */
    lastFrozen: frozen.sort().at(-1) ?? null,
  };
}

async function loadUserData(userId: string, tz: string) {
  const day = localDay(tz);
  const [completions, byReason, days, unlocked] = await Promise.all([
    db
      .select({
        language: lessonProgress.language,
        slug: lessonProgress.lessonSlug,
      })
      .from(lessonProgress)
      .where(eq(lessonProgress.userId, userId)),
    db
      .select({
        reason: xpEvent.reason,
        events: count(),
        xp: sum(xpEvent.amount),
      })
      .from(xpEvent)
      .where(eq(xpEvent.userId, userId))
      .groupBy(xpEvent.reason),
    db
      .select({ day, xp: sum(xpEvent.amount) })
      .from(xpEvent)
      .where(eq(xpEvent.userId, userId))
      .groupBy(sql`1`)
      .orderBy(sql`1 desc`)
      .limit(400),
    db
      .select({
        id: userAchievement.achievementId,
        unlockedAt: userAchievement.unlockedAt,
      })
      .from(userAchievement)
      .where(eq(userAchievement.userId, userId)),
  ]);

  const reasonTotals = new Map(
    byReason.map((r) => [
      r.reason,
      { events: r.events, xp: Number(r.xp ?? 0) },
    ]),
  );
  const totalXp = byReason.reduce((n, r) => n + Number(r.xp ?? 0), 0);
  const today = todayIn(tz);
  const freezes = await settleFreezes(
    userId,
    days.map((d) => d.day),
    today,
  );
  const streak = computeStreaks(
    [...days.map((d) => d.day), ...freezes.frozen],
    today,
  );
  const xpByDay = new Map(days.map((d) => [d.day, Number(d.xp ?? 0)]));

  // Module / level completion from the course outlines.
  const done = new Set(completions.map((c) => `${c.language}/${c.slug}`));
  let modulesCompleted = 0;
  let levelsCompleted = 0;
  for (const language of languages) {
    const course = getCourse(language.slug);
    if (!course) continue;
    for (const level of course.levels) {
      const finished = level.modules.map(
        (m) =>
          m.lessons.length > 0 &&
          m.lessons.every((l) => done.has(`${language.slug}/${l.slug}`)),
      );
      modulesCompleted += finished.filter(Boolean).length;
      if (finished.length > 0 && finished.every(Boolean)) levelsCompleted++;
    }
  }

  const stats: AchievementStats = {
    totalXp,
    lessonsCompleted: completions.length,
    exercisesSolved: reasonTotals.get("exercise")?.events ?? 0,
    quizzesAced: reasonTotals.get("quiz")?.events ?? 0,
    currentStreak: streak.current,
    modulesCompleted,
    levelsCompleted,
  };

  return {
    completions,
    done,
    stats,
    streak,
    today,
    xpByDay,
    unlocked,
    freezes: { available: freezes.available, lastFrozen: freezes.lastFrozen },
  };
}

/** Unlocks any achievements the learner now qualifies for; returns the new ones. */
export async function evaluateAchievements(userId: string, tz: string) {
  const { stats, unlocked } = await loadUserData(userId, tz);
  const have = new Set(unlocked.map((u) => u.id));
  const fresh = achievements.filter(
    (a) => !have.has(a.id) && a.unlocked(stats),
  );
  if (fresh.length === 0) return { stats, newAchievements: [] };

  const inserted = await db
    .insert(userAchievement)
    .values(fresh.map((a) => ({ userId, achievementId: a.id })))
    .onConflictDoNothing()
    .returning({ id: userAchievement.achievementId });
  const ids = new Set(inserted.map((r) => r.id));
  return {
    stats,
    newAchievements: fresh.filter((a) => ids.has(a.id)).map(toInfo),
  };
}

/** After XP was (maybe) awarded: the new total, level and fresh achievements, for toasts. */
export async function summarizeAward(userId: string, xpAwarded: number) {
  const { stats, newAchievements } = await evaluateAchievements(
    userId,
    await getTimeZone(),
  );
  const level = levelFromXp(stats.totalXp).level;
  return {
    ok: true as const,
    xpAwarded,
    totalXp: stats.totalXp,
    level,
    leveledUp:
      xpAwarded > 0 && levelFromXp(stats.totalXp - xpAwarded).level < level,
    newAchievements,
  };
}

/**
 * Completed lessons and rewarded activities (lesson exercises and quizzes,
 * practice problems) for one language (for the browser).
 */
export async function getLanguageProgress(userId: string, language: string) {
  const prefix = `/learn/${language}/`;
  const practice = `/practice/${language}/`;
  const [completed, events] = await Promise.all([
    db
      .select({ slug: lessonProgress.lessonSlug })
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.userId, userId),
          eq(lessonProgress.language, language),
        ),
      ),
    db
      .select({ ref: xpEvent.ref })
      .from(xpEvent)
      .where(
        and(
          eq(xpEvent.userId, userId),
          or(
            sql`${xpEvent.ref} like ${`${prefix}%#%`}`,
            sql`${xpEvent.ref} like ${`${practice}%#%`}`,
          ),
        ),
      ),
  ]);
  return {
    completed: completed.map((c) => c.slug),
    activities: events.map((e) => e.ref).filter((r): r is string => !!r),
  };
}

/** Lesson and problem titles by permalink, in the learner's language where translated. */
function lessonTitles(locale: Locale) {
  const titles = new Map(getAllLessons().map((l) => [l.permalink, l.title]));
  for (const language of getPracticeLanguages()) {
    for (const problem of getProblems(language, locale)) {
      titles.set(problem.permalink, problem.title);
    }
  }
  if (locale !== defaultLocale) {
    for (const language of languages) {
      const course = getCourse(language.slug, locale);
      const translated = (course?.levels ?? []).flatMap((level) =>
        level.modules.flatMap((m) => m.lessons),
      );
      for (const lesson of translated) {
        titles.set(lesson.permalink, lesson.title);
      }
    }
  }
  return titles;
}

export type RecentReason =
  "lesson" | "exercise" | "quiz" | "review" | "daily" | "other";

/** What an XP event was for; the dashboard turns this into a sentence. */
function describeEvent(
  reason: string,
  ref: string | null,
  titles: ReturnType<typeof lessonTitles>,
) {
  const [permalink] = (ref ?? "").split("#");
  return {
    reason: (["lesson", "exercise", "quiz", "review", "daily"].includes(reason)
      ? reason
      : "other") as RecentReason,
    /** null when the lesson no longer exists */
    lessonTitle: titles.get(permalink) ?? null,
  };
}

/**
 * Everything the dashboard shows. Lesson titles come in `locale`; days are
 * "YYYY-MM-DD" strings for the page to format.
 */
export async function getDashboard(
  userId: string,
  tz: string,
  locale: Locale = defaultLocale,
) {
  const [data, profile] = await Promise.all([
    loadUserData(userId, tz),
    getLearnerProfile(userId),
  ]);
  const { stats, streak, today, xpByDay, done } = data;

  const recent = await db
    .select({
      reason: xpEvent.reason,
      ref: xpEvent.ref,
      amount: xpEvent.amount,
      createdAt: xpEvent.createdAt,
    })
    .from(xpEvent)
    .where(eq(xpEvent.userId, userId))
    .orderBy(desc(xpEvent.createdAt))
    .limit(6);

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i - 6);
    return { date: d, xp: xpByDay.get(d) ?? 0 };
  });

  // Per-language progress.
  const courses = languages
    .map((language) => {
      const course = getCourse(language.slug, locale);
      if (!course || course.stats.lessons === 0) return null;
      const ordered = course.levels.flatMap((l) =>
        l.modules.flatMap((m) => m.lessons),
      );
      const completed = ordered.filter((l) =>
        done.has(`${language.slug}/${l.slug}`),
      ).length;
      return {
        slug: language.slug,
        name: language.name,
        completed,
        total: ordered.length,
      };
    })
    .filter((c) => c !== null);

  const started = courses.filter((c) => c.completed > 0);

  const unlockedAt = new Map(data.unlocked.map((u) => [u.id, u.unlockedAt]));
  const titles = lessonTitles(locale);

  return {
    stats,
    level: levelFromXp(stats.totalXp),
    streak,
    todayXp: xpByDay.get(today) ?? 0,
    dailyGoal: profile?.dailyGoal ?? DAILY_GOAL_XP,
    freezes: data.freezes,
    profile,
    week,
    courses: started.length > 0 ? started : courses.slice(0, 1),
    achievements: achievements.map((a) => ({
      ...toInfo(a),
      unlockedAt: unlockedAt.get(a.id) ?? null,
    })),
    recent: recent.map((e) => ({
      ...describeEvent(e.reason, e.ref, titles),
      amount: e.amount,
      at: e.createdAt,
    })),
  };
}

export type Dashboard = Awaited<ReturnType<typeof getDashboard>>;

/** Streak, XP and today's goal: what the Telegram bot shows and reminds about. */
export async function getStreakStatus(userId: string, tz: string) {
  const [data, profile] = await Promise.all([
    loadUserData(userId, tz),
    getLearnerProfile(userId),
  ]);
  return {
    streak: data.streak,
    totalXp: data.stats.totalXp,
    level: levelFromXp(data.stats.totalXp).level,
    todayXp: data.xpByDay.get(data.today) ?? 0,
    dailyGoal: profile?.dailyGoal ?? DAILY_GOAL_XP,
    freezes: data.freezes.available,
  };
}
export type { AchievementInfo };

export async function getLinkedProviders(userId: string) {
  const rows = await db
    .select({ providerId: account.providerId })
    .from(account)
    .where(eq(account.userId, userId));
  return rows.map((r) => r.providerId);
}
