import { seededRandom } from "./random";

/** 32-bit FNV-1a hash of a string, for seeding. */
function hash(text: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * The order a quiz shows its options in: a shuffle of 0…count-1 seeded by the
 * quiz's key ("python/variables#quiz-2"), so the server and the browser, the
 * lesson, daily review and the bot all show the same order, and the EN and RU
 * versions of a lesson (same key) match. Lessons are written with the right
 * answer anywhere; this keeps it from sitting in the same place every time.
 * `round` > 0 gives a fresh order, for "Try again".
 */
export function quizOrder(key: string, count: number, round = 0): number[] {
  const order = Array.from({ length: count }, (_, i) => i);
  const random = seededRandom(hash(round ? `${key}~${round}` : key));
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** The key quizOrder uses for a lesson's n-th quiz (1-based, as in "quiz-n"). */
export function quizKey(language: string, slug: string, n: number) {
  return `${language}/${slug}#quiz-${n}`;
}

/** A quiz with its options in quizOrder, and `answer` pointing at the same option. */
export function shuffleQuiz<Q extends { options: string[]; answer: number }>(
  quiz: Q,
  key: string,
): Q {
  const order = quizOrder(key, quiz.options.length);
  return {
    ...quiz,
    options: order.map((i) => quiz.options[i]),
    answer: order.indexOf(quiz.answer),
  };
}
