import { after } from "next/server";

import { evaluateAchievements } from "@/lib/progress";
import { pingAchievements } from "@/lib/telegram/notify";
import { miniAppCaller } from "@/lib/tg-app/player";
import { guessWordle, wordleOverview, wordleToday } from "@/lib/tg-app/wordle";

/**
 * Code Wordle:
 *   { action: "overview" }                 today's game in each language
 *   { action: "today", language }          the board so far
 *   { action: "guess", language, guess }   one guess, graded here
 */
export async function POST(request: Request) {
  const caller = await miniAppCaller(request);
  if (caller instanceof Response) return caller;
  const body = (await request.json().catch(() => null)) as {
    action?: string;
    language?: string;
    guess?: string;
  } | null;
  const { player, link } = caller;
  const language = String(body?.language ?? "");

  let result: unknown = null;
  if (body?.action === "overview") result = await wordleOverview(player);
  else if (body?.action === "today")
    result = await wordleToday(player, language);
  else if (body?.action === "guess") {
    const outcome = await guessWordle(
      player,
      language,
      String(body.guess ?? ""),
    );
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
