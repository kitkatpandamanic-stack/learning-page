import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { Lesson, Problem } from "#site/content";

/**
 * A lesson's compiled MDX. Bodies are kept out of lessons.json (see
 * velite.config.ts) and read from disk, so a page loads only its own
 * lesson's body. Lesson pages are generated at build time, when the files
 * are there (next.config.ts also ships them with the server, just in case).
 */
export async function loadLessonBody(
  lesson: Pick<Lesson, "language" | "slug" | "locale">,
): Promise<string> {
  const file = join(
    process.cwd(),
    ".velite",
    "bodies",
    lesson.language,
    `${lesson.slug}.${lesson.locale}.json`,
  );
  return JSON.parse(await readFile(file, "utf8")) as string;
}

/** A practice problem's compiled MDX (.velite/bodies/practice/<language>/…). */
export function loadProblemBody(
  problem: Pick<Problem, "language" | "slug" | "locale">,
): Promise<string> {
  return loadLessonBody({
    ...problem,
    language: `practice/${problem.language}`,
  });
}
