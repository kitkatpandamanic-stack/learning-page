import { courses, lessons, type Lesson } from "#site/content";

import { defaultLocale, type Locale } from "@/lib/i18n";
import { languages, type Language } from "@/lib/languages";
import { levels } from "@/lib/levels";

export type CourseModule = {
  slug: string;
  title: string;
  description: string;
  project?: string;
  /** 1-based position across the whole course (capstones aren't numbered) */
  number: number;
  /** The level's final project, listed after its modules */
  capstone?: boolean;
  lessons: Lesson[];
};

export type CourseLevel = (typeof levels)[number] & {
  summary: string;
  /** Capstone project title */
  capstone: string;
  /** Regular modules, then the capstone module when it has a slug */
  modules: CourseModule[];
};

export type CourseStats = {
  modules: number;
  lessons: number;
  minutes: number;
};

export function getLanguage(slug: string): Language | undefined {
  return languages.find((l) => l.slug === slug);
}

/** English lessons are the source of truth: they define order and slugs. */
const originals = lessons.filter((l) => l.locale === defaultLocale);

/**
 * A module's lessons in a language. Lessons without a translation yet fall
 * back to English (their `locale` says which one you got).
 */
function lessonsFor(language: string, module: string, locale: Locale) {
  return originals
    .filter((l) => l.language === language && l.module === module)
    .sort((a, b) => a.order - b.order)
    .map((lesson) =>
      locale === defaultLocale
        ? lesson
        : (lessons.find(
            (t) =>
              t.locale === locale &&
              t.language === language &&
              t.module === module &&
              t.file === lesson.file,
          ) ?? lesson),
    );
}

/** The full outline for a language, or undefined if its course isn't written yet. */
export function getCourse(language: string, locale: Locale = defaultLocale) {
  const original = courses.find(
    (c) => c.language === language && c.locale === defaultLocale,
  );
  if (!original) return undefined;
  // course.<locale>.yml has the same structure (checked at build time).
  const course =
    courses.find((c) => c.language === language && c.locale === locale) ??
    original;

  let number = 0;
  const courseLevels: CourseLevel[] = course.levels.map((lvl) => {
    const { slug, title, description } = lvl.capstone;
    const modules: CourseModule[] = lvl.modules.map((m) => ({
      ...m,
      number: ++number,
      lessons: lessonsFor(language, m.slug, locale),
    }));
    if (slug) {
      modules.push({
        slug,
        title,
        description: description ?? "",
        number: 0,
        capstone: true,
        lessons: lessonsFor(language, slug, locale),
      });
    }
    return {
      ...levels[lvl.level],
      summary: lvl.summary,
      capstone: title,
      modules,
    };
  });

  const allLessons = courseLevels.flatMap((l) =>
    l.modules.flatMap((m) => m.lessons),
  );

  return {
    intro: course.intro,
    levels: courseLevels,
    firstLesson: allLessons[0],
    stats: {
      modules: number,
      lessons: allLessons.length,
      minutes: allLessons.reduce((sum, l) => sum + l.duration, 0),
    } satisfies CourseStats,
  };
}

export function getCourseStats(language: string): CourseStats | undefined {
  return getCourse(language)?.stats;
}

/** Every lesson in English: slugs, permalinks and XP are the same in all languages. */
export function getAllLessons() {
  return originals;
}

/** A lesson plus where it sits in its course: level, module, neighbours and position. */
export function getLessonContext(
  language: string,
  slug: string,
  locale: Locale = defaultLocale,
) {
  const course = getCourse(language, locale);
  if (!course) return undefined;

  const ordered = course.levels.flatMap((level) =>
    level.modules.flatMap((module) =>
      module.lessons.map((lesson) => ({ lesson, module, level })),
    ),
  );
  const index = ordered.findIndex((entry) => entry.lesson.slug === slug);
  if (index === -1) return undefined;

  const { lesson, module, level } = ordered[index];
  return {
    lesson,
    module,
    level,
    levels: course.levels,
    prev: ordered[index - 1]?.lesson,
    next: ordered[index + 1]?.lesson,
    position: index + 1,
    total: ordered.length,
  };
}
