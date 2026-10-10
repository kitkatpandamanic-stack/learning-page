import type { Tone } from "@/lib/tones";

/** XP for activities inside a lesson. Lesson XP itself comes from its frontmatter. */
export const EXERCISE_XP = 10;
export const QUIZ_XP = 5;
export const DAILY_GOAL_XP = 50;

export type XpReason = "lesson" | "exercise" | "quiz" | "review" | "daily";

// ---------------------------------------------------------------------------
// Learner levels: level L needs 50·L·(L−1) XP → 0, 100, 300, 600, 1000, …
// ---------------------------------------------------------------------------

export function xpForLevel(level: number) {
  return 50 * level * (level - 1);
}

export function levelFromXp(xp: number) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const floor = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return {
    level,
    /** XP earned inside the current level */
    current: xp - floor,
    /** XP the current level spans */
    span: next - floor,
    toNext: next - xp,
  };
}

// ---------------------------------------------------------------------------
// Achievements: definitions live here; unlocks are stored in user_achievement.
// ---------------------------------------------------------------------------

export type AchievementStats = {
  totalXp: number;
  lessonsCompleted: number;
  exercisesSolved: number;
  quizzesAced: number;
  currentStreak: number;
  modulesCompleted: number;
  levelsCompleted: number;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  tone: Tone;
  unlocked: (s: AchievementStats) => boolean;
};

export const achievements: Achievement[] = [
  {
    id: "first-lesson",
    title: "First Steps",
    description: "Complete your first lesson",
    emoji: "🐣",
    tone: "lime",
    unlocked: (s) => s.lessonsCompleted >= 1,
  },
  {
    id: "five-lessons",
    title: "High Five",
    description: "Complete 5 lessons",
    emoji: "🖐️",
    tone: "cyan",
    unlocked: (s) => s.lessonsCompleted >= 5,
  },
  {
    id: "first-exercise",
    title: "Hello, Code",
    description: "Solve your first coding exercise",
    emoji: "💻",
    tone: "violet",
    unlocked: (s) => s.exercisesSolved >= 1,
  },
  {
    id: "ten-exercises",
    title: "Problem Solver",
    description: "Solve 10 coding exercises",
    emoji: "🧩",
    tone: "pink",
    unlocked: (s) => s.exercisesSolved >= 10,
  },
  {
    id: "quiz-whiz",
    title: "Quiz Whiz",
    description: "Answer 5 quizzes right on the first try",
    emoji: "🧠",
    tone: "amber",
    unlocked: (s) => s.quizzesAced >= 5,
  },
  {
    id: "module-complete",
    title: "Module Master",
    description: "Finish every lesson in a module",
    emoji: "📦",
    tone: "cyan",
    unlocked: (s) => s.modulesCompleted >= 1,
  },
  {
    id: "level-complete",
    title: "Level Up",
    description: "Finish every lesson in a course level",
    emoji: "🎓",
    tone: "violet",
    unlocked: (s) => s.levelsCompleted >= 1,
  },
  {
    id: "streak-3",
    title: "On Fire",
    description: "Learn 3 days in a row",
    emoji: "🔥",
    tone: "pink",
    unlocked: (s) => s.currentStreak >= 3,
  },
  {
    id: "streak-7",
    title: "Unstoppable",
    description: "Learn 7 days in a row",
    emoji: "⚡",
    tone: "amber",
    unlocked: (s) => s.currentStreak >= 7,
  },
  {
    id: "xp-100",
    title: "Century",
    description: "Earn 100 XP",
    emoji: "💯",
    tone: "lime",
    unlocked: (s) => s.totalXp >= 100,
  },
  {
    id: "xp-500",
    title: "XP Hoarder",
    description: "Earn 500 XP",
    emoji: "💎",
    tone: "violet",
    unlocked: (s) => s.totalXp >= 500,
  },
];

export const achievementById = new Map(achievements.map((a) => [a.id, a]));

/** Public shape sent to the browser (no functions). */
export type AchievementInfo = Omit<Achievement, "unlocked">;

export function toInfo(achievement: Achievement): AchievementInfo {
  const { id, title, description, emoji, tone } = achievement;
  return { id, title, description, emoji, tone };
}

// ---------------------------------------------------------------------------
// Streaks from a list of local dates ("YYYY-MM-DD") with activity.
// ---------------------------------------------------------------------------

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * The current streak counts back from today, or from yesterday if the learner
 * hasn't been active yet today (so the streak isn't "lost" until midnight).
 */
export function computeStreaks(activeDays: string[], today: string) {
  const days = new Set(activeDays);
  let start = days.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (days.has(start)) {
    current++;
    start = addDays(start, -1);
  }

  let longest = 0;
  for (const day of days) {
    if (days.has(addDays(day, -1))) continue; // not the start of a run
    let length = 0;
    let d = day;
    while (days.has(d)) {
      length++;
      d = addDays(d, 1);
    }
    longest = Math.max(longest, length);
  }

  return { current, longest, activeToday: days.has(today) };
}
