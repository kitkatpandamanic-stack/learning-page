/**
 * Daily review: quiz questions from finished lessons come back on a
 * spaced-repetition schedule (a Leitner system). Each right answer moves a
 * question to the next box and a longer gap; a wrong one sends it back to
 * tomorrow. Days are the learner's local "YYYY-MM-DD".
 */

/** Days until a question comes back after a right answer, by its new box (1-based). */
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60] as const;

/** Questions in one sitting. */
export const REVIEW_SESSION_SIZE = 10;

/** Questions seen for the first time per day, so a big backlog doesn't swamp anyone. */
export const NEW_CARDS_PER_DAY = 5;

/** XP for finishing the day's review, once a day. */
export const REVIEW_XP = 15;

export function addDays(day: string, n: number) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Where a question goes after an answer. */
export function nextReview(box: number, correct: boolean, today: string) {
  if (!correct) return { box: 0, dueOn: addDays(today, 1) };
  const next = Math.min(box + 1, REVIEW_INTERVALS.length);
  return { box: next, dueOn: addDays(today, REVIEW_INTERVALS[next - 1]) };
}

export type CardState = { ref: string; box: number; dueOn: string };

/**
 * Today's questions: those due (oldest first, shakiest first), then new ones
 * up to the daily allowance. `candidates` are unseen questions, best first.
 */
export function planSession({
  cards,
  candidates,
  newToday,
  today,
  size = REVIEW_SESSION_SIZE,
}: {
  cards: CardState[];
  candidates: string[];
  /** Questions already seen for the first time today */
  newToday: number;
  today: string;
  size?: number;
}) {
  const due = cards
    .filter((c) => c.dueOn <= today)
    .sort((a, b) => a.dueOn.localeCompare(b.dueOn) || a.box - b.box)
    .map((c) => c.ref);
  const allowance = Math.max(0, NEW_CARDS_PER_DAY - newToday);
  const fresh = candidates.slice(0, allowance);
  return {
    refs: [...due, ...fresh].slice(0, size),
    /** Everything waiting today, beyond this sitting too */
    waiting: due.length + fresh.length,
  };
}
