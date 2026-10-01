import { relations } from "drizzle-orm";
import {
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
