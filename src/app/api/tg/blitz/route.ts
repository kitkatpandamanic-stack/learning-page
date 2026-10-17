import { after } from "next/server";

import { evaluateAchievements } from "@/lib/progress";
import { pingAchievements } from "@/lib/telegram/notify";
import { answerBlitz, blitzResult, startBlitz } from "@/lib/tg-app/blitz";
import { miniAppCaller } from "@/lib/tg-app/player";

/**
 * The Daily Blitz, one step at a time:
 *   { action: "start", language }                  the questions (no answers)
 *   { action: "answer", language, index, choice }  right or wrong, graded here
 *   { action: "result", language }                score, ranking, explanations
 */
export async function POST(request: Request) {
  const caller = await miniAppCaller(request);
  if (caller instanceof Response) return caller;
  const body = (await request.json().catch(() => null)) as {
    action?: string;
    language?: string;
    index?: number;
    choice?: number;
  } | null;
  const language = String(body?.language ?? "");
  const { player, link } = caller;

  let result: unknown = null;
  if (body?.action === "start") result = await startBlitz(player, language);
  else if (body?.action === "answer")
    result = await answerBlitz(
      player,
      language,
      Number(body.index),
      Number(body.choice),
    );
  else if (body?.action === "result") {
    const outcome = await blitzResult(player, language);
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
  }
  if (!result) return new Response("Bad request", { status: 400 });
  return Response.json(result);
}
