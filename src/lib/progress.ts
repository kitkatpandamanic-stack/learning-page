import "server-only";

import { cookies } from "next/headers";
import { and, count, desc, eq, or, sql, sum } from "drizzle-orm";

import { db } from "@/db";
import { account, lessonProgress, userAchievement, xpEvent } from "@/db/schema";
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
import { languages } from "@/lib/languages";
import { isValidTimeZone } from "@/lib/time-zone";

// ---------------------------------------------------------------------------
// Time zones: streaks and "today" use the learner's local day. The browser
// stores its time zone in a cookie (see TimeZoneCookie).
// ---------------------------------------------------------------------------

export async function getTimeZone() {
  const tz = (await cookies()).get("tz")?.value;
  return tz && isValidTimeZone(tz) ? tz : "UTC";
}

function todayIn(tz: string) {
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
  const streak = computeStreaks(
    days.map((d) => d.day),
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

  return { completions, done, stats, streak, today, xpByDay, unlocked };
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

export type RecentReason = "lesson" | "exercise" | "quiz" | "other";

/** What an XP event was for; the dashboard turns this into a sentence. */
function describeEvent(
  reason: string,
  ref: string | null,
  titles: ReturnType<typeof lessonTitles>,
) {
  const [permalink] = (ref ?? "").split("#");
  return {
    reason: (reason === "lesson" || reason === "exercise" || reason === "quiz"
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
  const data = await loadUserData(userId, tz);
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

  // Per-language progress and the next lesson to continue with.
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
      const next = ordered.find((l) => !done.has(`${language.slug}/${l.slug}`));
      return {
        slug: language.slug,
        name: language.name,
        completed,
        total: ordered.length,
        next: next ? { title: next.title, href: next.permalink } : null,
      };
    })
    .filter((c) => c !== null);

  const started = courses.filter((c) => c.completed > 0);
  const continueWith =
    started.find((c) => c.next)?.next ??
    courses.find((c) => c.next)?.next ??
    null;

  const unlockedAt = new Map(data.unlocked.map((u) => [u.id, u.unlockedAt]));
  const titles = lessonTitles(locale);

  return {
    stats,
    level: levelFromXp(stats.totalXp),
    streak,
    todayXp: xpByDay.get(today) ?? 0,
    dailyGoal: DAILY_GOAL_XP,
    week,
    courses: started.length > 0 ? started : courses.slice(0, 1),
    continueWith,
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
export type { AchievementInfo };

export async function getLinkedProviders(userId: string) {
  const rows = await db
    .select({ providerId: account.providerId })
    .from(account)
    .where(eq(account.userId, userId));
  return rows.map((r) => r.providerId);
}
