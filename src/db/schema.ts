import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
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
  leaderboard: boolean("leaderboard").default(false).notNull(),
  /** The learner's local day of the last reminder (one a day at most) */
  lastReminded: date("last_reminded", { mode: "string" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
