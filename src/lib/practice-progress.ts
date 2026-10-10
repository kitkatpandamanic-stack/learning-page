/**
 * A learner's practice in one language: solved problems by difficulty and
 * topic, and which problem to try next. No server imports, so it's testable.
 */

import { difficulties, type Difficulty } from "@/lib/practice-meta";

type ProblemInfo = {
  permalink: string;
  title: string;
  difficulty: Difficulty;
  topic: string;
};

type Count = { solved: number; total: number };

/**
 * `problems` come easiest first. "Next" is the easiest unsolved problem in
 * the topic the learner has done least of, so practice stays balanced;
 * someone who hasn't started gets the very first problem.
 */
export function summarizePractice(
  problems: ProblemInfo[],
  solved: Set<string>,
) {
  const difficulty = Object.fromEntries(
    difficulties.map((d) => [d, { solved: 0, total: 0 }]),
  ) as Record<Difficulty, Count>;
  const topics = new Map<string, Count>();
  let done = 0;
  for (const p of problems) {
    const isSolved = solved.has(p.permalink);
    if (isSolved) done++;
    difficulty[p.difficulty].total++;
    if (isSolved) difficulty[p.difficulty].solved++;
    const topic = topics.get(p.topic) ?? { solved: 0, total: 0 };
    topic.total++;
    if (isSolved) topic.solved++;
    topics.set(p.topic, topic);
  }

  const list = [...topics].map(([topic, count]) => ({ topic, ...count }));
  const firstOpen = (topic?: string) =>
    problems.find(
      (p) => !solved.has(p.permalink) && (!topic || p.topic === topic),
    );
  // Least-done topic first; between equals, the one with the easier problem.
  const rank = (t: (typeof list)[number]) => [
    t.solved / t.total,
    difficulties.indexOf(firstOpen(t.topic)!.difficulty),
  ];
  const focus =
    done === 0
      ? undefined
      : list
          .filter((t) => t.solved < t.total)
          .sort((a, b) => {
            const [ra, da] = rank(a);
            const [rb, db] = rank(b);
            return ra - rb || da - db;
          })[0];
  const next = firstOpen(focus?.topic);

  return {
    solved: done,
    total: problems.length,
    difficulty,
    topics: list,
    focusTopic: focus?.topic ?? null,
    next: next
      ? {
          permalink: next.permalink,
          title: next.title,
          difficulty: next.difficulty,
          topic: next.topic,
        }
      : null,
  };
}

export type PracticeSummary = ReturnType<typeof summarizePractice>;
