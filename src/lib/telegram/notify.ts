import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { lessonProgress } from "@/db/schema";
import { getCourse, getLanguage } from "@/lib/content";
import { achievementById } from "@/lib/gamification";
import { localizedPath } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";
import { telegram, telegramConfigured } from "@/lib/telegram/api";
import { getLinkForUser } from "@/lib/telegram/links";
import {
  pingCaption,
  pingKeyboard,
  type BotLocale,
} from "@/lib/telegram/texts";
import enAchievements from "../../../messages/en/achievements.json";
import ruAchievements from "../../../messages/ru/achievements.json";

const achievementTexts: Record<
  BotLocale,
  Record<string, { title: string; description: string }>
> = { en: enAchievements, ru: ruAchievements };

/** Title and description of an achievement in the bot's language. */
export function achievementText(id: string, locale: BotLocale) {
  const achievement = achievementById.get(id);
  if (!achievement) return null;
  const text = achievementTexts[locale][id] ?? achievement;
  return {
    emoji: achievement.emoji,
    tone: achievement.tone,
    title: text.title,
    description: text.description,
  };
}

/** The picture under a ping, drawn by /api/telegram/achievement-card. */
export const pingCardUrl = (id: string, locale: BotLocale) =>
  `${siteUrl}/api/telegram/achievement-card?id=${encodeURIComponent(id)}&lang=${locale}`;

type Ping =
  { kind: "achievement"; id: string } | { kind: "course"; language: string };

/**
 * A picture message to the learner's Telegram, if they linked it and kept
 * these messages on. Never throws: a ping is a bonus, not part of the work.
 */
async function ping(userId: string, pings: Ping[]) {
  if (!telegramConfigured || pings.length === 0) return;
  try {
    const link = await getLinkForUser(userId);
    if (!link?.pings) return;
    const locale = link.locale as BotLocale;
    const dashboard = `${siteUrl}${localizedPath("/dashboard", locale)}`;
    for (const p of pings) {
      let caption: string;
      let card: string;
      if (p.kind === "achievement") {
        const text = achievementText(p.id, locale);
        if (!text) continue;
        caption = pingCaption(locale, { kind: "achievement", ...text });
        card = p.id;
      } else {
        const name = getLanguage(p.language)?.name ?? p.language;
        caption = pingCaption(locale, { kind: "course", name });
        card = `course-${p.language}`;
      }
      await telegram("sendPhoto", {
        chat_id: link.telegramId,
        photo: pingCardUrl(card, locale),
        caption,
        parse_mode: "HTML",
        reply_markup: pingKeyboard(locale, dashboard),
      });
    }
  } catch (error) {
    console.error("telegram ping failed", error);
  }
}

export function pingAchievements(userId: string, ids: string[]) {
  return ping(
    userId,
    ids.map((id) => ({ kind: "achievement", id })),
  );
}

/** After a lesson was newly completed: a ping if it was the course's last one. */
export async function pingIfCourseFinished(userId: string, language: string) {
  if (!telegramConfigured) return;
  const course = getCourse(language);
  const lessons = (course?.levels ?? []).flatMap((level) =>
    level.modules.flatMap((m) => m.lessons.map((l) => l.slug)),
  );
  if (lessons.length === 0) return;
  const done = await db
    .select({ slug: lessonProgress.lessonSlug })
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.language, language),
      ),
    );
  const finished = new Set(done.map((d) => d.slug));
  if (lessons.every((slug) => finished.has(slug)))
    await ping(userId, [{ kind: "course", language }]);
}
