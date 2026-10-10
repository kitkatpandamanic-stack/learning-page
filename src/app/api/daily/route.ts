import type { NextRequest } from "next/server";

import { getDailyFeed } from "@/lib/daily-feed";

/**
 * A day's problem of the day (every language) and quiz question, in English
 * and Russian: GET /api/daily?date=2026-10-10 (default: today in UTC).
 */
export async function GET(request: NextRequest) {
  const param = request.nextUrl.searchParams.get("date");
  const date =
    param && /^\d{4}-\d{2}-\d{2}$/.test(param) && !isNaN(Date.parse(param))
      ? param
      : new Date().toISOString().slice(0, 10);
  return Response.json(getDailyFeed(date), {
    headers: { "Cache-Control": "public, s-maxage=3600" },
  });
}
