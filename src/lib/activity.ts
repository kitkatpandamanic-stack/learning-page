/**
 * The dashboard's activity calendar: the last few months as weeks of days,
 * Monday first, each with its XP. No server imports, so it's easy to test.
 */

export type CalendarDay = {
  date: string;
  xp: number;
  /** A streak freeze covered this day */
  frozen: boolean;
  /** 0 (nothing) to 4 (twice the daily goal or more) */
  level: 0 | 1 | 2 | 3 | 4;
};

/** How dark a day is, measured against the learner's daily goal. */
export function activityLevel(xp: number, goal: number): CalendarDay["level"] {
  if (xp <= 0) return 0;
  if (xp < goal / 2) return 1;
  if (xp < goal) return 2;
  if (xp < goal * 2) return 3;
  return 4;
}

function addDays(day: string, n: number) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** 0 for Monday … 6 for Sunday. */
const weekday = (day: string) =>
  (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7;

export function buildCalendar({
  xpByDay,
  frozen,
  today,
  goal,
  weeks = 26,
}: {
  xpByDay: Map<string, number>;
  frozen: Iterable<string>;
  today: string;
  goal: number;
  weeks?: number;
}) {
  const frozenDays = new Set(frozen);
  const firstMonday = addDays(today, -weekday(today) - (weeks - 1) * 7);

  // Columns of seven days; days after today are null.
  const columns: (CalendarDay | null)[][] = [];
  for (let w = 0; w < weeks; w++) {
    const column: (CalendarDay | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(firstMonday, w * 7 + d);
      if (date > today) {
        column.push(null);
        continue;
      }
      const xp = xpByDay.get(date) ?? 0;
      column.push({
        date,
        xp,
        frozen: xp === 0 && frozenDays.has(date),
        level: activityLevel(xp, goal),
      });
    }
    columns.push(column);
  }

  // A month's name goes above the first week that starts in it.
  const months: { column: number; date: string }[] = [];
  columns.forEach((column, i) => {
    const monday = column[0]?.date ?? addDays(firstMonday, i * 7);
    const previous = i > 0 ? addDays(monday, -7) : null;
    if (!previous || previous.slice(0, 7) !== monday.slice(0, 7))
      months.push({ column: i, date: monday });
  });
  // A label squeezed into the first column or two would collide with the next.
  if (months.length > 1 && months[1].column - months[0].column < 3)
    months.shift();

  const sumDays = (from: number, to: number) => {
    let xp = 0;
    for (let i = from; i <= to; i++) xp += xpByDay.get(addDays(today, -i)) ?? 0;
    return xp;
  };
  const days = columns.flat().filter((d): d is CalendarDay => d !== null);
  const best = days.reduce<CalendarDay | null>(
    (top, d) => (d.xp > (top?.xp ?? 0) ? d : top),
    null,
  );

  return {
    columns,
    months,
    totals: {
      /** The last 7 days, today included */
      thisWeek: sumDays(0, 6),
      /** The 7 days before those */
      lastWeek: sumDays(7, 13),
      activeDays: days.filter((d) => d.xp > 0).length,
      totalDays: days.length,
      best: best && { date: best.date, xp: best.xp },
    },
  };
}

export type Calendar = ReturnType<typeof buildCalendar>;
