import type { NextRequest } from "next/server";

import { getDailyFeed } from "@/lib/daily-feed";
import { renderDailyCard } from "@/lib/og";
import { sortDaily } from "@/lib/telegram/texts";

const colors: Record<string, string> = {
  python: "#60a5fa",
  javascript: "#facc15",
  typescript: "#38bdf8",
  sql: "#22d3ee",
};
const monograms: Record<string, string> = {
  python: "Py",
  javascript: "JS",
  typescript: "TS",
  sql: "SQL",
};
const levels = {
  en: { easy: "easy", medium: "medium", hard: "hard" },
  ru: { easy: "лёгкая", medium: "средняя", hard: "сложная" },
} as Record<string, Record<string, string>>;

const DAY = 86_400_000;
function nearToday(date: string, now = Date.now()) {
  const offset = (Date.parse(`${date}T00:00:00Z`) - now) / DAY;
  return offset >= -8 && offset <= 3;
}

/**
 * The daily post's picture: GET /api/telegram/daily-card?date=2026-10-12
 * &lang=both|en|ru. Telegram downloads it when the post goes out.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const date = params.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date)))
    return new Response("Bad date", { status: 400 });
  // Drawing a picture is the most expensive thing the site does: only for
  // days around today (previews of the next posts, last week's posts).
  if (!nearToday(date))
    return new Response("Date out of range", { status: 400 });
  const lang =
    params.get("lang") === "en"
      ? "en"
      : params.get("lang") === "ru"
        ? "ru"
        : "both";
  const titles = lang === "en" ? "en" : "ru";
  const day = (locale: string) =>
    new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    }).format(new Date(`${date}T12:00:00Z`));
  const image = await renderDailyCard({
    label:
      lang === "en"
        ? "Problem of the day"
        : lang === "ru"
          ? "Задача дня"
          : "Задача дня · Problem of the day",
    date: lang === "both" ? `${day("ru")} · ${day("en")}` : day(lang),
    rows: sortDaily(getDailyFeed(date).problems).map((p) => ({
      monogram: monograms[p.language] ?? p.name,
      color: colors[p.language] ?? "#c4b5fd",
      title: p[titles].title,
      difficulty:
        lang === "both"
          ? `${levels.ru[p.difficulty]} · ${levels.en[p.difficulty]}`
          : levels[lang][p.difficulty],
    })),
    footer:
      lang === "en"
        ? "+20 XP for solving one today · pandadev"
        : lang === "ru"
          ? "+20 XP за решение сегодня · pandadev"
          : "+20 XP за решение сегодня · +20 XP for solving one today",
  });
  image.headers.set("Cache-Control", "public, s-maxage=86400, max-age=3600");
  return image;
}
