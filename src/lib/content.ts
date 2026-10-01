import { courses, lessons, type Lesson } from "#site/content";

import { languages, type Language } from "@/lib/languages";
import { levels } from "@/lib/levels";

export type CourseModule = {
  slug: string;
  title: string;
  description: string;
  project?: string;
  /** 1-based position across the whole course */
  number: number;
  lessons: Lesson[];
};

export type CourseLevel = (typeof levels)[number] & {
  summary: string;
  capstone: string;
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

function lessonsFor(language: string, module: string) {
  return lessons
    .filter((l) => l.language === language && l.module === module)
    .sort((a, b) => a.order - b.order);
}

/** The full outline for a language, or undefined if its course isn't written yet. */
export function getCourse(language: string) {
  const course = courses.find((c) => c.language === language);
  if (!course) return undefined;

  let number = 0;
  const courseLevels: CourseLevel[] = course.levels.map((lvl) => ({
    ...levels[lvl.level],
    summary: lvl.summary,
    capstone: lvl.capstone,
    modules: lvl.modules.map((m) => ({
      ...m,
      number: ++number,
      lessons: lessonsFor(language, m.slug),
    })),
  }));

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

export function getAllLessons() {
  return lessons;
}
