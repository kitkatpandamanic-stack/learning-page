import type { NextRequest } from "next/server";

import { recordSecurityEvent, requester } from "@/lib/security-events";
import { postLeaderboard, sendReminders } from "@/lib/telegram/jobs";
import { secretMatches } from "@/lib/telegram/secret";

/**
 * Scheduled bot jobs, called by GitHub Actions (.github/workflows/telegram.yml):
 *   GET /api/telegram/cron?job=reminders    every hour
 *   GET /api/telegram/cron?job=leaderboard  Mondays
 * with "Authorization: Bearer <CRON_SECRET>".
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (
    !secretMatches(
      auth?.replace(/^Bearer /, "") ?? null,
      process.env.CRON_SECRET,
    )
  ) {
    recordSecurityEvent("bad-secret", "telegram-cron", await requester());
    return new Response("Forbidden", { status: 403 });
  }
  const job = request.nextUrl.searchParams.get("job");
  if (job === "reminders") return Response.json(await sendReminders());
  if (job === "leaderboard") return Response.json(await postLeaderboard());
  return new Response("Unknown job", { status: 400 });
}
