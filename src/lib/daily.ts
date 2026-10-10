/**
 * Coming back every day: the problem of the day and streak freezes. Days are
 * the learner's local "YYYY-MM-DD". No server imports: the practice pages
 * work out today's problem in the browser with the same functions.
 */

/** Extra XP for solving the day's problem that day, once a day. */
export const DAILY_BONUS_XP = 20;

/** A streak freeze is earned for every this many days in a row… */
export const FREEZE_EVERY = 7;
/** …and a learner holds at most this many. */
export const MAX_FREEZES = 2;

export function addDays(day: string, n: number) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const dayNumber = (day: string) =>
  Math.floor(Date.parse(`${day}T12:00:00Z`) / 86_400_000);

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function hash(text: string) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * Which of `count` problems is the problem of the day in a language. Steps
 * through all of them (in a shuffled-looking order) before any repeats, and
 * each language follows its own order.
 */
export function dailyIndex(day: string, language: string, count: number) {
  if (count <= 0) return -1;
  const step =
    [17, 13, 11, 7, 5, 3, 1].find((s) => gcd(s, count) === 1 && s < count) ?? 1;
  const offset = hash(language) % count;
  return (((dayNumber(day) * step + offset) % count) + count) % count;
}

/** Today's problem among a language's problems (in their canonical order). */
export function dailyProblem<T>(day: string, language: string, problems: T[]) {
  const index = dailyIndex(day, language, problems.length);
  return index === -1 ? undefined : problems[index];
}

/**
 * Streak freezes, decided when the learner shows up again:
 * - `fill`: missed days (just before today's run) that freezes cover,
 *   so the streak carries on;
 * - `earn`: today completed another FREEZE_EVERY-day stretch, worth a freeze.
 * `active` holds days with XP and days already frozen.
 */
export function planFreezes({
  active,
  today,
  available,
}: {
  active: Set<string>;
  today: string;
  available: number;
}) {
  const fill: string[] = [];
  const yesterday = addDays(today, -1);
  // Only the gap right before now: missed yesterday (and maybe the days before).
  if (!active.has(yesterday) && available > 0) {
    let day = yesterday;
    const gap: string[] = [];
    while (!active.has(day) && gap.length <= available) {
      gap.push(day);
      day = addDays(day, -1);
    }
    // There must be a streak to save, and enough freezes for the whole gap.
    if (active.has(day) && gap.length <= available) fill.push(...gap);
  }

  const days = new Set([...active, ...fill]);
  let streak = 0;
  for (let day = today; days.has(day); day = addDays(day, -1)) streak++;
  const earn =
    days.has(today) &&
    streak > 0 &&
    streak % FREEZE_EVERY === 0 &&
    available - fill.length < MAX_FREEZES;

  return { fill, earn };
}
