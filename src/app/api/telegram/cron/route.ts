import type { NextRequest } from "next/server";

import { recordSecurityEvent, requester } from "@/lib/security-events";
import {
  postDaily,
  postLeaderboardOnce,
  runTick,
  sendReminders,
} from "@/lib/telegram/jobs";
import { secretMatches } from "@/lib/telegram/secret";

/**
 * Scheduled bot jobs, with "Authorization: Bearer <CRON_SECRET>":
 *   GET /api/telegram/cron?job=tick         every hour, on the hour
 *                                           (cron-job.org; GitHub Actions
 *                                           .github/workflows/telegram-bot.yml
 *                                           as a backup)
 *   GET /api/telegram/cron?job=reminders    reminders only
 *   GET /api/telegram/cron?job=daily-post   the channel's daily post
 *   GET /api/telegram/cron?job=leaderboard  the Monday leaderboard
 * Posts go out once a day however many schedulers call; a failed tick
 * answers 500 so the scheduler shows it.
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
  if (job === "tick") {
    const tick = await runTick();
    return Response.json(tick, { status: tick.ok ? 200 : 500 });
  }
  if (job === "reminders") return Response.json(await sendReminders());
  if (job === "daily-post") return Response.json(await postDaily());
  if (job === "leaderboard") return Response.json(await postLeaderboardOnce());
  return new Response("Unknown job", { status: 400 });
}
