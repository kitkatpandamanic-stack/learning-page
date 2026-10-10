import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  bookmark,
  lessonProgress,
  pageVisit,
  reviewCard,
  xpEvent,
} from "@/db/schema";
import { getCourse } from "@/lib/content";
import { defaultLocale, type Locale } from "@/lib/i18n";
import { languages } from "@/lib/languages";
import type { Difficulty } from "@/lib/practice-meta";
import { getPracticeLanguages, getProblems } from "@/lib/practice";
import { awardXp, todayIn } from "@/lib/progress";
import {
  addDays,
  nextReview,
  planSession,
  REVIEW_SESSION_SIZE,
  REVIEW_XP,
} from "@/lib/review-schedule";

// ---------------------------------------------------------------------------
// Pages learners can save, revisit and review: lessons and practice problems
// ---------------------------------------------------------------------------

type Quiz = {
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
};

export type PageInfo = {
  permalink: string;
  kind: "lesson" | "problem";
  language: string;
  title: string;
  description: string;
  /** Lessons: the module's title */
  module?: string;
  /** Problems: easy, medium or hard */
  difficulty?: Difficulty;
};

type Catalog = {
  pages: Map<string, PageInfo>;
  /** Each lesson's quiz questions, by permalink */
  quizzes: Map<string, Quiz[]>;
  /** Each language's lessons and problems in course / list order */
  lessonOrder: Map<string, string[]>;
  problemOrder: Map<string, string[]>;
};

const catalogs = new Map<Locale, Catalog>();

/** Every lesson and problem in `locale` (English where not translated yet). */
export function getCatalog(locale: Locale = defaultLocale): Catalog {
  const cached = catalogs.get(locale);
  if (cached) return cached;
  const pages = new Map<string, PageInfo>();
  const quizzes = new Map<string, Quiz[]>();
  const lessonOrder = new Map<string, string[]>();
  const problemOrder = new Map<string, string[]>();
  for (const language of languages) {
    const course = getCourse(language.slug, locale);
    if (!course) continue;
    const order: string[] = [];
    for (const level of course.levels) {
      for (const courseModule of level.modules) {
        for (const lesson of courseModule.lessons) {
          order.push(lesson.permalink);
          pages.set(lesson.permalink, {
            permalink: lesson.permalink,
            kind: "lesson",
            language: language.slug,
            title: lesson.title,
            description: lesson.description,
            module: courseModule.title,
          });
          quizzes.set(lesson.permalink, lesson.quizzes);
        }
      }
    }
    lessonOrder.set(language.slug, order);
  }
  for (const language of getPracticeLanguages()) {
    const list = getProblems(language, locale);
    problemOrder.set(
      language,
      list.map((p) => p.permalink),
    );
    for (const problem of list) {
      pages.set(problem.permalink, {
        permalink: problem.permalink,
        kind: "problem",
        language,
        title: problem.title,
        description: problem.description,
        difficulty: problem.difficulty,
      });
    }
  }
  const catalog = { pages, quizzes, lessonOrder, problemOrder };
  catalogs.set(locale, catalog);
  return catalog;
}

export function isPage(permalink: string) {
  return getCatalog().pages.has(permalink);
}

// ---------------------------------------------------------------------------
// Bookmarks
// ---------------------------------------------------------------------------

/** Saved permalinks, newest first. */
export async function listBookmarks(userId: string) {
  const rows = await db
    .select({ permalink: bookmark.permalink, savedAt: bookmark.createdAt })
    .from(bookmark)
    .where(eq(bookmark.userId, userId))
    .orderBy(desc(bookmark.createdAt));
  return rows;
}

export async function setBookmark(
  userId: string,
  permalink: string,
  saved: boolean,
) {
  if (saved) {
    await db
      .insert(bookmark)
      .values({ userId, permalink })
      .onConflictDoNothing();
  } else {
    await db
      .delete(bookmark)
      .where(
        and(eq(bookmark.userId, userId), eq(bookmark.permalink, permalink)),
      );
  }
}

/** Saved lessons and problems with their titles in `locale`, newest first. */
export async function getSavedPages(userId: string, locale: Locale) {
  const { pages } = getCatalog(locale);
  return (await listBookmarks(userId)).flatMap(({ permalink, savedAt }) => {
    const page = pages.get(permalink);
    return page ? [{ ...page, savedAt }] : [];
  });
}

// ---------------------------------------------------------------------------
// Continue where you left off
// ---------------------------------------------------------------------------

export async function recordVisit(userId: string, permalink: string) {
  await db
    .insert(pageVisit)
    .values({ userId, permalink })
    .onConflictDoUpdate({
      target: [pageVisit.userId, pageVisit.permalink],
      set: { visitedAt: sql`now()` },
    });
}

async function finishedPages(userId: string) {
  const [lessons, problems] = await Promise.all([
    db
      .select({
        language: lessonProgress.language,
        slug: lessonProgress.lessonSlug,
        completedAt: lessonProgress.completedAt,
      })
      .from(lessonProgress)
      .where(eq(lessonProgress.userId, userId))
      .orderBy(desc(lessonProgress.completedAt)),
    db
      .select({ ref: xpEvent.ref })
      .from(xpEvent)
      .where(
        and(
          eq(xpEvent.userId, userId),
          sql`${xpEvent.ref} like '/practice/%#exercise-1'`,
        ),
      ),
  ]);
  return {
    /** Lesson permalinks, most recently finished first */
    lessons: lessons.map((l) => `/learn/${l.language}/${l.slug}`),
    problems: new Set(problems.map((p) => p.ref!.split("#")[0])),
  };
}

export type ContinueTarget = {
  permalink: string;
  kind: "lesson" | "problem";
  language: string;
  title: string;
  /** resume: open but not finished · next: the one after a finished page · start: nothing opened yet */
  reason: "resume" | "next" | "start";
};

/**
 * Where to pick up: the page opened last if it isn't finished, else the one
 * after it; with no visits, the next lesson of a started course.
 */
export async function getContinue(
  userId: string,
  locale: Locale,
): Promise<{ target: ContinueTarget | null; recent: PageInfo[] }> {
  const { pages, lessonOrder, problemOrder } = getCatalog(locale);
  const [visits, done] = await Promise.all([
    db
      .select({ permalink: pageVisit.permalink })
      .from(pageVisit)
      .where(eq(pageVisit.userId, userId))
      .orderBy(desc(pageVisit.visitedAt))
      .limit(12),
    finishedPages(userId),
  ]);
  const finished = (page: PageInfo) =>
    page.kind === "lesson"
      ? done.lessons.includes(page.permalink)
      : done.problems.has(page.permalink);
  const target = (page: PageInfo, reason: ContinueTarget["reason"]) => ({
    permalink: page.permalink,
    kind: page.kind,
    language: page.language,
    title: page.title,
    reason,
  });

  const recent = visits.flatMap((v) => pages.get(v.permalink) ?? []);
  const last = recent[0];
  let result: ContinueTarget | null = null;
  if (last && !finished(last)) result = target(last, "resume");
  else if (last) {
    const order =
      (last.kind === "lesson" ? lessonOrder : problemOrder).get(
        last.language,
      ) ?? [];
    const after = order
      .slice(order.indexOf(last.permalink) + 1)
      .map((p) => pages.get(p)!)
      .find((page) => !finished(page));
    if (after) result = target(after, "next");
  }
  if (!result) {
    // The next lesson in the course of the lesson finished last, or the first course.
    const language =
      pages.get(done.lessons[0] ?? "")?.language ?? languages[0].slug;
    for (const slug of [language, ...lessonOrder.keys()]) {
      const next = (lessonOrder.get(slug) ?? [])
        .map((p) => pages.get(p)!)
        .find((page) => !finished(page));
      if (next) {
        result = target(next, done.lessons.length ? "next" : "start");
        break;
      }
    }
  }
  return {
    target: result,
    recent: recent.slice(0, 5),
  };
}

// ---------------------------------------------------------------------------
// Daily review
// ---------------------------------------------------------------------------

export type ReviewQuestion = Quiz & {
  ref: string;
  lessonTitle: string;
  lessonHref: string;
  language: string;
  /** Seen before, or new today */
  isNew: boolean;
};

/** The quiz behind "/learn/python/loops#quiz-2", in `locale`. */
function quizFor(ref: string, locale: Locale) {
  const [permalink, id] = ref.split("#");
  const match = /^quiz-([1-9]\d*)$/.exec(id ?? "");
  const catalog = getCatalog(locale);
  const page = catalog.pages.get(permalink);
  const quiz = match && catalog.quizzes.get(permalink)?.[Number(match[1]) - 1];
  return quiz && page ? { quiz, page } : undefined;
}

const localDayOf = (date: Date, tz: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(date);

async function reviewState(userId: string, tz: string, locale: Locale) {
  const today = todayIn(tz);
  const [cards, done] = await Promise.all([
    db
      .select({
        ref: reviewCard.ref,
        box: reviewCard.box,
        dueOn: reviewCard.dueOn,
        firstReviewedOn: reviewCard.firstReviewedOn,
        reviewedAt: reviewCard.reviewedAt,
      })
      .from(reviewCard)
      .where(eq(reviewCard.userId, userId)),
    finishedPages(userId),
  ]);
  const known = cards.filter((c) => quizFor(c.ref, locale));
  const seen = new Set(cards.map((c) => c.ref));
  // Questions from finished lessons not reviewed yet, newest lessons first.
  const candidates = done.lessons.flatMap((permalink) =>
    (getCatalog(locale).quizzes.get(permalink) ?? [])
      .map((_, i) => `${permalink}#quiz-${i + 1}`)
      .filter((ref) => !seen.has(ref)),
  );
  const plan = planSession({
    cards: known,
    candidates,
    newToday: cards.filter((c) => c.firstReviewedOn === today).length,
    today,
  });
  return {
    today,
    cards,
    plan,
    reviewedToday: cards.filter((c) => localDayOf(c.reviewedAt, tz) === today)
      .length,
    dueTomorrow: known.filter((c) => c.dueOn <= addDays(today, 1)).length,
    deckSize: known.length + candidates.length,
  };
}

/** A day's review is done once nothing is waiting, or after a full sitting. */
const isDone = (waiting: number, reviewedToday: number) =>
  waiting === 0 || reviewedToday >= REVIEW_SESSION_SIZE;

/** Today's questions for the review page. */
export async function getReviewSession(
  userId: string,
  tz: string,
  locale: Locale,
) {
  const state = await reviewState(userId, tz, locale);
  const seen = new Set(state.cards.map((c) => c.ref));
  const questions: ReviewQuestion[] = state.plan.refs.flatMap((ref) => {
    const found = quizFor(ref, locale);
    if (!found) return [];
    return [
      {
        ref,
        ...found.quiz,
        lessonTitle: found.page.title,
        lessonHref: found.page.permalink,
        language: found.page.language,
        isNew: !seen.has(ref),
      },
    ];
  });
  return {
    questions,
    waiting: state.plan.waiting,
    reviewedToday: state.reviewedToday,
    doneToday: isDone(state.plan.waiting, state.reviewedToday),
    dueTomorrow: state.dueTomorrow,
    deckSize: state.deckSize,
  };
}

/** For the dashboard card. */
export async function getReviewSummary(
  userId: string,
  tz: string,
  locale: Locale,
) {
  const { questions, ...summary } = await getReviewSession(userId, tz, locale);
  return { ...summary, next: questions.length };
}

/**
 * Grades one answer on the server, moves the question to its next box and,
 * when the day's review is complete, pays REVIEW_XP once.
 */
export async function answerReview(
  userId: string,
  tz: string,
  ref: string,
  choice: number,
) {
  const found = quizFor(ref, defaultLocale);
  if (!found) return null;
  const done = await finishedPages(userId);
  if (!done.lessons.includes(found.page.permalink)) return null;

  const today = todayIn(tz);
  const [card] = await db
    .select({ box: reviewCard.box, dueOn: reviewCard.dueOn })
    .from(reviewCard)
    .where(and(eq(reviewCard.userId, userId), eq(reviewCard.ref, ref)));
  const correct = choice === found.quiz.answer;
  // Answering a question that isn't due (a double click, a second tab) changes nothing.
  if (!card || card.dueOn <= today) {
    const next = nextReview(card?.box ?? 0, correct, today);
    await db
      .insert(reviewCard)
      .values({ userId, ref, ...next, firstReviewedOn: today })
      .onConflictDoUpdate({
        target: [reviewCard.userId, reviewCard.ref],
        set: { ...next, reviewedAt: sql`now()` },
      });
  }

  const state = await reviewState(userId, tz, defaultLocale);
  const finished = isDone(state.plan.waiting, state.reviewedToday);
  const xpAwarded =
    finished && (await awardXp(userId, "review", `review:${today}`, REVIEW_XP))
      ? REVIEW_XP
      : 0;
  return { correct, answer: found.quiz.answer, finished, xpAwarded };
}
