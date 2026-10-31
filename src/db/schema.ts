import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

// Better Auth tables (user, session, account, verification).
// Regenerate with: npx auth@latest generate --config src/lib/auth.ts --output src/db/auth-schema.ts
export * from "./auth-schema";

/** One row per lesson a learner has finished. */
export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    language: text("language").notNull(),
    lessonSlug: text("lesson_slug").notNull(),
    completedAt: timestamp("completed_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("lesson_progress_user_lesson_idx").on(
      table.userId,
      table.language,
      table.lessonSlug,
    ),
  ],
);

/** Every XP gain, so totals, weekly charts and streaks can be derived. */
export const xpEvent = pgTable(
  "xp_event",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    /** e.g. "lesson", "quiz", "exercise", "streak-bonus" */
    reason: text("reason").notNull(),
    /** What the XP was for, e.g. "/learn/javascript/variables" */
    ref: text("ref"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("xp_event_user_created_idx").on(table.userId, table.createdAt),
    // Each activity pays out once: the same (user, reason, ref) can't repeat.
    uniqueIndex("xp_event_user_reason_ref_idx").on(
      table.userId,
      table.reason,
      table.ref,
    ),
  ],
);

/** Achievements a learner has unlocked; definitions live in code. */
export const userAchievement = pgTable(
  "user_achievement",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    achievementId: text("achievement_id").notNull(),
    unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.achievementId] })],
);

/** Lessons and practice problems a learner saved for later. */
export const bookmark = pgTable(
  "bookmark",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** e.g. "/learn/python/loops" or "/practice/sql/films-per-genre" */
    permalink: text("permalink").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.permalink] })],
);

/** The last time a learner opened each lesson or problem ("continue where you left off"). */
export const pageVisit = pgTable(
  "page_visit",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    permalink: text("permalink").notNull(),
    visitedAt: timestamp("visited_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.permalink] }),
    index("page_visit_user_visited_idx").on(table.userId, table.visitedAt),
  ],
);

/**
 * Daily review: one row per quiz question a learner has reviewed, with its
 * spaced-repetition box and the day it comes back.
 */
export const reviewCard = pgTable(
  "review_card",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** The quiz, e.g. "/learn/python/loops#quiz-2" */
    ref: text("ref").notNull(),
    /** 0 after a wrong answer, up to the last interval after right ones */
    box: integer("box").notNull().default(0),
    /** The learner's local day it's due again */
    dueOn: date("due_on", { mode: "string" }).notNull(),
    /** The learner's local day it was first reviewed (limits new cards per day) */
    firstReviewedOn: date("first_reviewed_on", { mode: "string" }).notNull(),
    reviewedAt: timestamp("reviewed_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.ref] }),
    index("review_card_user_due_idx").on(table.userId, table.dueOn),
  ],
);

/**
 * Code a learner wrote in an exercise editor or the playground, so it
 * follows them to other devices. A null `code` records a reset.
 */
export const savedCode = pgTable(
  "saved_code",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** locale:path#editor, e.g. "en:/learn/python/loops#exercise-1" */
    key: text("key").notNull(),
    code: text("code"),
    /** When the learner made this edit, by their device's clock (newest wins) */
    editedAt: timestamp("edited_at").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.key] })],
);

/** What a learner chose in the welcome steps: language, starting level, daily goal. */
export const learnerProfile = pgTable("learner_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  /** Language slug, e.g. "python" */
  language: text("language").notNull(),
  /** Starting level, 0 (new to coding) to 2 */
  level: integer("level").notNull(),
  /** Daily XP goal */
  dailyGoal: integer("daily_goal").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Streak freezes: "earned" on the day a learner completed another 7 days in
 * a row, "used" for each missed day a freeze covered.
 */
export const streakFreeze = pgTable(
  "streak_freeze",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["earned", "used"] }).notNull(),
    /** The learner's local day */
    day: date("day", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.kind, table.day] })],
);

/**
 * A learner's Telegram account, linked from the profile page through the bot
 * (t.me/<bot>?start=<token>). Reminders and the weekly leaderboard are opt-in.
 */
export const telegramLink = pgTable("telegram_link", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  /** Telegram's user id, which is also the private chat with the bot */
  telegramId: bigint("telegram_id", { mode: "number" }).notNull().unique(),
  username: text("username"),
  /** Site locale the bot writes in, "en" or "ru" */
  locale: text("locale").notNull(),
  /** The learner's time zone, for "today" and the evening reminder */
  timeZone: text("time_zone").notNull(),
  reminders: boolean("reminders").default(false).notNull(),
  /** The local hour (0–23) the reminder goes out, chosen in the bot's /settings */
  reminderHour: smallint("reminder_hour").default(20).notNull(),
  /** "Pause N days": no reminders before this local day */
  remindersResumeOn: date("reminders_resume_on", { mode: "string" }),
  /** A picture message when an achievement unlocks or a course is finished */
  pings: boolean("pings").default(true).notNull(),
  leaderboard: boolean("leaderboard").default(false).notNull(),
  /** The learner's local day of the last reminder (one a day at most) */
  lastReminded: date("last_reminded", { mode: "string" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Quiz polls the bot sent to a linked learner in a private chat (/quiz), so
 * the answer (a poll_answer update) can earn XP and count for the quiz streak.
 */
export const telegramQuiz = pgTable(
  "telegram_quiz",
  {
    /** Telegram's poll id */
    pollId: text("poll_id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** The lesson quiz it came from, e.g. "/learn/python/loops#2" */
    ref: text("ref").notNull(),
    correctOption: smallint("correct_option").notNull(),
    sentAt: timestamp("sent_at").defaultNow().notNull(),
    /** The learner's local day of the answer; null until answered */
    day: date("day", { mode: "string" }),
    correct: boolean("correct"),
  },
  (table) => [index("telegram_quiz_user_day_idx").on(table.userId, table.day)],
);

/**
 * Scheduled posts that already went out (the daily post, the leaderboard),
 * so several schedulers can call the same job and it still runs once.
 */
export const telegramJobRun = pgTable(
  "telegram_job_run",
  {
    job: text("job").notNull(),
    /** The channel's day (Tashkent) */
    day: date("day", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.job, table.day] })],
);

/** One-time codes behind the "Connect Telegram" button; valid for minutes. */
export const telegramLinkToken = pgTable("telegram_link_token", {
  token: text("token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  locale: text("locale").notNull(),
  timeZone: text("time_zone").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

/**
 * Daily Blitz in the Telegram Mini App: one try a day per language, keyed
 * by the Telegram account so people who haven't linked one can play too
 * (without XP). Answers are graded and timed on the server.
 */
export const tgBlitz = pgTable(
  "tg_blitz",
  {
    telegramId: bigint("telegram_id", { mode: "number" }).notNull(),
    /** The Blitz day (Tashkent), the same set of questions for everyone */
    day: date("day", { mode: "string" }).notNull(),
    language: text("language").notNull(),
    /** The linked PandaDev account, for XP and the ranking */
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    /** [{ c: choice, ok: right?, ms: since the start }] in question order */
    answers: jsonb("answers")
      .$type<{ c: number; ok: boolean; ms: number }[]>()
      .default([])
      .notNull(),
    score: smallint("score").default(0).notNull(),
    /** Time of the last answer, for breaking ties */
    ms: integer("ms").default(0).notNull(),
    finishedAt: timestamp("finished_at"),
    /** XP this Blitz paid (only the day's first finished one pays) */
    xp: smallint("xp").default(0).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.telegramId, table.day, table.language] }),
    index("tg_blitz_day_language_idx").on(table.day, table.language),
  ],
);

/**
 * Duels in the Telegram Mini App: someone picks a language and plays 5
 * questions, then shares the challenge; anyone who opens it plays the same
 * questions. Open for 48 hours.
 */
export const tgDuel = pgTable("tg_duel", {
  /** Short random id, used in t.me/<bot>?startapp=duel_<id> */
  id: text("id").primaryKey(),
  creatorTelegramId: bigint("creator_telegram_id", {
    mode: "number",
  }).notNull(),
  creatorUserId: text("creator_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  /** The challenger's Telegram first name, shown to the people they challenge */
  creatorName: text("creator_name").notNull(),
  /** The challenger's language, for the bot's messages about results */
  creatorLocale: text("creator_locale").notNull(),
  language: text("language").notNull(),
  /** The questions, as "<lesson permalink>#<quiz number in that lesson>" */
  refs: jsonb("refs").$type<string[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

/** One person's go at a duel (the challenger's too): graded and timed on the server. */
export const tgDuelPlay = pgTable(
  "tg_duel_play",
  {
    duelId: text("duel_id")
      .notNull()
      .references(() => tgDuel.id, { onDelete: "cascade" }),
    telegramId: bigint("telegram_id", { mode: "number" }).notNull(),
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    /** Telegram first name, for the duel's ranking */
    name: text("name").notNull(),
    startedAt: timestamp("started_at").notNull(),
    answers: jsonb("answers")
      .$type<{ c: number; ok: boolean; ms: number }[]>()
      .default([])
      .notNull(),
    score: smallint("score").default(0).notNull(),
    ms: integer("ms").default(0).notNull(),
    finishedAt: timestamp("finished_at"),
    /** XP this play paid (finishing, winning) */
    xp: smallint("xp").default(0).notNull(),
    /** The challenger got the bot's message about this result */
    notified: boolean("notified").default(false).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.duelId, table.telegramId] }),
    index("tg_duel_play_telegram_idx").on(table.telegramId, table.startedAt),
  ],
);

/**
 * Group chats with a PandaDev league (/league in the group): members who
 * joined from the group's button get a weekly XP table, posted in the group
 * on Mondays unless an admin turned that off.
 */
export const tgGroup = pgTable("tg_group", {
  /** Telegram's chat id (negative for groups) */
  chatId: bigint("chat_id", { mode: "number" }).primaryKey(),
  title: text("title").notNull(),
  /** The Monday post with last week's table */
  weekly: boolean("weekly").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Who joined a group's league; XP counts for linked PandaDev accounts. */
export const tgGroupMember = pgTable(
  "tg_group_member",
  {
    chatId: bigint("chat_id", { mode: "number" })
      .notNull()
      .references(() => tgGroup.chatId, { onDelete: "cascade" }),
    telegramId: bigint("telegram_id", { mode: "number" }).notNull(),
    /** Telegram first name, shown in the group's table */
    name: text("name").notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.chatId, table.telegramId] }),
    index("tg_group_member_telegram_idx").on(table.telegramId),
  ],
);

/**
 * Code Wordle in the Telegram Mini App: one word a day per language, six
 * guesses, graded on the server. Keyed by the Telegram account so people
 * without a PandaDev account can play too (without XP).
 */
export const tgWordle = pgTable(
  "tg_wordle",
  {
    telegramId: bigint("telegram_id", { mode: "number" }).notNull(),
    day: date("day", { mode: "string" }).notNull(),
    language: text("language").notNull(),
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    /** The guesses so far, lowercase */
    guesses: jsonb("guesses").$type<string[]>().default([]).notNull(),
    solved: boolean("solved").default(false).notNull(),
    finishedAt: timestamp("finished_at"),
    /** XP this game paid (the day's first solved word pays) */
    xp: smallint("xp").default(0).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.telegramId, table.day, table.language] }),
  ],
);

/**
 * Bug Hunt rounds in the Telegram Mini App: 60 seconds of "works or has a
 * bug?" cards in one language, graded and timed on the server. As many
 * rounds as people like; the day's first finished round pays XP.
 */
export const tgBugHunt = pgTable(
  "tg_bughunt",
  {
    /** Short random id the app sends back with each answer */
    id: text("id").primaryKey(),
    telegramId: bigint("telegram_id", { mode: "number" }).notNull(),
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    /** The Tashkent day the round was played */
    day: date("day", { mode: "string" }).notNull(),
    language: text("language").notNull(),
    /** The cards in the order shown, as "<language>:<card number>" */
    cards: jsonb("cards").$type<string[]>().notNull(),
    startedAt: timestamp("started_at").notNull(),
    /** [{ c: answered "works"?, ok: right?, ms: since the start }] */
    answers: jsonb("answers")
      .$type<{ c: boolean; ok: boolean; ms: number }[]>()
      .default([])
      .notNull(),
    score: smallint("score").default(0).notNull(),
    finishedAt: timestamp("finished_at"),
    xp: smallint("xp").default(0).notNull(),
  },
  (table) => [
    index("tg_bughunt_day_language_idx").on(table.day, table.language),
    index("tg_bughunt_telegram_idx").on(table.telegramId, table.language),
  ],
);

/**
 * What the health collector (.github/workflows/health.yml) found outside the
 * site: Vercel deployments, Neon usage, Sentry errors, GitHub security
 * alerts. One row per run, kept for 90 days; /admin/health reads the latest.
 */
export const healthSnapshot = pgTable(
  "health_snapshot",
  {
    id: serial("id").primaryKey(),
    data: jsonb("data").notNull(),
    collectedAt: timestamp("collected_at").defaultNow().notNull(),
  },
  (table) => [index("health_snapshot_collected_at_idx").on(table.collectedAt)],
);

/**
 * Things worth a look on /admin/health: refused rate limits, the report
 * form's spam trap, wrong secrets on the bot and cron endpoints, signed-in
 * people opening /admin. Kept for 30 days; `who` is a user id or a hashed IP.
 */
export const securityEvent = pgTable(
  "security_event",
  {
    id: serial("id").primaryKey(),
    kind: text("kind").notNull(),
    detail: text("detail"),
    who: text("who"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("security_event_created_at_idx").on(table.createdAt)],
);

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  user: one(user, { fields: [lessonProgress.userId], references: [user.id] }),
}));

export const xpEventRelations = relations(xpEvent, ({ one }) => ({
  user: one(user, { fields: [xpEvent.userId], references: [user.id] }),
}));

export const userAchievementRelations = relations(
  userAchievement,
  ({ one }) => ({
    user: one(user, {
      fields: [userAchievement.userId],
      references: [user.id],
    }),
  }),
);
