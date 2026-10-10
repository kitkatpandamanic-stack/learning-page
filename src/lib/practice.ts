import { problems, type Problem } from "#site/content";

import { defaultLocale, type Locale } from "@/lib/i18n";
import { difficulties } from "@/lib/practice-meta";

export type { Problem };

/** English problems are the source of truth: they define order, slugs and XP. */
const originals = problems
  .filter((p) => p.locale === defaultLocale)
  .sort((a, b) => a.order - b.order);

const translated = (problem: Problem, locale: Locale) =>
  locale === defaultLocale
    ? problem
    : (problems.find(
        (p) =>
          p.locale === locale &&
          p.language === problem.language &&
          p.file === problem.file,
      ) ?? problem);

/** Every problem in English (for XP, the sitemap and static pages). */
export function getAllProblems() {
  return originals;
}

/** A language's problems, easiest first, in `locale` where translated. */
export function getProblems(language: string, locale: Locale = defaultLocale) {
  return originals
    .filter((p) => p.language === language)
    .sort(
      (a, b) =>
        difficulties.indexOf(a.difficulty) -
          difficulties.indexOf(b.difficulty) || a.order - b.order,
    )
    .map((p) => translated(p, locale));
}

/** Languages that have practice problems. */
export function getPracticeLanguages() {
  return [...new Set(originals.map((p) => p.language))];
}

/** A problem plus its neighbours in the list. */
export function getProblemContext(
  language: string,
  slug: string,
  locale: Locale = defaultLocale,
) {
  const list = getProblems(language, locale);
  const index = list.findIndex((p) => p.slug === slug);
  if (index === -1) return undefined;
  return {
    problem: list[index],
    prev: list[index - 1],
    next: list[index + 1],
    position: index + 1,
    total: list.length,
  };
}

/**
 * A language's problems in their fixed order (by file number), the list the
 * problem of the day picks from, in `locale` where translated.
 */
export function getDailyCandidates(
  language: string,
  locale: Locale = defaultLocale,
) {
  return originals
    .filter((p) => p.language === language)
    .map((p) => translated(p, locale));
}

/** What the browser needs to show today's problem in a language. */
export function dailySet(language: string, locale: Locale = defaultLocale) {
  return {
    language,
    problems: getDailyCandidates(language, locale).map((p) => ({
      permalink: p.permalink,
      title: p.title,
      difficulty: p.difficulty,
    })),
  };
}
