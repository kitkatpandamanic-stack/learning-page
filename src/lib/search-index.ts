import { getCourse } from "@/lib/content";
import type { Locale } from "@/lib/i18n";
import { languages } from "@/lib/languages";
import { getPracticeLanguages, getProblems } from "@/lib/practice";
import type { SearchEntry } from "@/lib/search";

/** Everything search can find in `locale`: lessons in course order, then problems. */
export function buildSearchIndex(locale: Locale): SearchEntry[] {
  const lessons = languages.flatMap((language) => {
    const course = getCourse(language.slug, locale);
    if (!course) return [];
    return course.levels.flatMap((level) =>
      level.modules.flatMap((module) =>
        module.lessons.map((lesson): SearchEntry => ({
          kind: "lesson",
          url: lesson.permalink,
          title: lesson.title,
          description: lesson.description,
          language: language.slug,
          context: module.title,
          sections: lesson.toc.flatMap((h) => [
            { title: h.title, url: h.url },
            ...h.items.map((s) => ({ title: s.title, url: s.url })),
          ]),
          terms: lesson.terms.join(" "),
        })),
      ),
    );
  });

  const problems = getPracticeLanguages().flatMap((language) =>
    getProblems(language, locale).map((problem): SearchEntry => ({
      kind: "problem",
      url: problem.permalink,
      title: problem.title,
      description: problem.description,
      language,
      context: problem.difficulty,
      sections: [],
      terms: problem.terms.join(" "),
    })),
  );

  return [...lessons, ...problems];
}
