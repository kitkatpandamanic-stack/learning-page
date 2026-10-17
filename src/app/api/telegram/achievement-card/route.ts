import type { NextRequest } from "next/server";

import { getLanguage } from "@/lib/content";
import { renderOgImage } from "@/lib/og";
import { achievementText } from "@/lib/telegram/notify";

const toneColors: Record<string, string> = {
  violet: "#8b5cf6",
  cyan: "#22d3ee",
  pink: "#f472b6",
  lime: "#a3e635",
  amber: "#f59e0b",
};

/**
 * The picture the bot sends when a badge unlocks or a course is finished:
 * GET /api/telegram/achievement-card?id=streak-7&lang=ru
 * (or id=course-python). Telegram downloads it; no names, so it caches.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const id = params.get("id") ?? "";
  const locale = params.get("lang") === "ru" ? "ru" : "en";
  const ru = locale === "ru";

  let card: Parameters<typeof renderOgImage>[0] | null = null;
  const course = /^course-([a-z]+)$/.exec(id);
  if (course) {
    const language = getLanguage(course[1]);
    if (language)
      card = {
        eyebrow: ru ? "Курс пройден" : "Course complete",
        title: language.name,
        subtitle: ru ? "Все уроки пройдены." : "Every lesson, done.",
        accent: "#f59e0b",
      };
  } else {
    const achievement = achievementText(id, locale);
    if (achievement)
      card = {
        eyebrow: ru ? "Новое достижение" : "Achievement unlocked",
        title: achievement.title,
        subtitle: achievement.description,
        accent: toneColors[achievement.tone],
      };
  }
  if (!card) return new Response("Unknown card", { status: 404 });

  const image = await renderOgImage(card);
  image.headers.set("Cache-Control", "public, s-maxage=604800, max-age=86400");
  return image;
}
