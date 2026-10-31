import { after } from "next/server";

import { evaluateAchievements } from "@/lib/progress";
import { pingAchievements } from "@/lib/telegram/notify";
import {
  answerBugHunt,
  bugHuntOverview,
  bugHuntResult,
  startBugHunt,
} from "@/lib/tg-app/bughunt";
import { miniAppCaller } from "@/lib/tg-app/player";

/**
 * Bug Hunt:
 *   { action: "overview" }                      bests per language
 *   { action: "start", language }               a new round (no answers)
 *   { action: "answer", round, index, works }   one swipe, graded here
 *   { action: "result", round }                 score, cards, explanations
 */
export async function POST(request: Request) {
  const caller = await miniAppCaller(request);
  if (caller instanceof Response) return caller;
  const body = (await request.json().catch(() => null)) as {
    action?: string;
    language?: string;
    round?: string;
    index?: number;
    works?: boolean;
  } | null;
  const { player, link } = caller;
  const round = String(body?.round ?? "");

  let result: unknown = null;
  switch (body?.action) {
    case "overview":
      result = await bugHuntOverview(player);
      break;
    case "start":
      result = await startBugHunt(player, String(body.language ?? ""));
      break;
    case "answer":
      result = await answerBugHunt(
        player,
        round,
        Number(body.index),
        body.works as boolean,
      );
      break;
    case "result": {
      const outcome = await bugHuntResult(player, round);
      // XP paid just now: a picture in the chat for any badge it unlocked.
      if (outcome?.paid && link)
        after(async () => {
          const { newAchievements } = await evaluateAchievements(
            link.userId,
            link.timeZone,
          );
          await pingAchievements(
            link.userId,
            newAchievements.map((a) => a.id),
          );
        });
      result = outcome;
      break;
    }
  }
  if (!result) return new Response("Bad request", { status: 400 });
  return Response.json(result);
}
