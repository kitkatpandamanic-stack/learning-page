/**
 * Practice problems: short standalone exercises at /practice/<language>/<slug>.
 * Shared by velite.config.ts (validation) and the pages, so it imports nothing
 * from the generated content.
 */

export const difficulties = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof difficulties)[number];

/** XP for solving a problem, paid once like a lesson exercise. */
export const PRACTICE_XP: Record<Difficulty, number> = {
  easy: 10,
  medium: 20,
  hard: 30,
};

/** Filter chips on the practice page, in this order. */
export const practiceTopics = [
  "strings",
  "numbers",
  "lists",
  "arrays",
  "dictionaries",
  "objects",
  "functions",
  "classes",
  "types",
  "async",
  "recursion",
  "algorithms",
  "text",
  // SQL
  "filtering",
  "joins",
  "grouping",
  "subqueries",
  "windows",
  "changes",
  "schema",
] as const;
export type PracticeTopic = (typeof practiceTopics)[number];
