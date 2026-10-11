import type { NextRequest } from "next/server";

import { dailyPost } from "@/lib/telegram/daily-post";

/**
 * The channel's post for a day, ready to send (scripts/telegram/post.mjs):
 * GET /api/telegram/daily-post?date=2026-10-12 (default: today in UTC).
 */
export async function GET(request: NextRequest) {
  const param = request.nextUrl.searchParams.get("date");
  const date =
    param && /^\d{4}-\d{2}-\d{2}$/.test(param) && !isNaN(Date.parse(param))
      ? param
      : new Date().toISOString().slice(0, 10);
  return Response.json(dailyPost(date, "both"), {
    headers: { "Cache-Control": "public, s-maxage=3600" },
  });
}
