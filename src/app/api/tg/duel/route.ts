import { after } from "next/server";

import { evaluateAchievements } from "@/lib/progress";
import { telegram } from "@/lib/telegram/api";
import { pingAchievements } from "@/lib/telegram/notify";
import {
  answerDuel,
  createDuel,
  duelInfo,
  duelResult,
  playerName,
  recentDuels,
  startDuel,
} from "@/lib/tg-app/duel";
import { miniAppCaller } from "@/lib/tg-app/player";
import { appLink } from "@/lib/tg-app/share";
import { appTexts, duelNotice, type AppLocale } from "@/lib/tg-app/texts";

/**
 * Duels, one step at a time:
 *   { action: "create", language }             a new challenge (play it first)
 *   { action: "info", duel }                   who challenged you, score to beat
 *   { action: "start", duel }                  the questions (no answers)
 *   { action: "answer", duel, index, choice }  right or wrong, graded here
 *   { action: "result", duel }                 score, ranking, explanations
 *   { action: "recent" }                       the player's last duels
 */
export async function POST(request: Request) {
  const caller = await miniAppCaller(request);
  if (caller instanceof Response) return caller;
  const body = (await request.json().catch(() => null)) as {
    action?: string;
    language?: string;
    duel?: string;
    index?: number;
    choice?: number;
  } | null;
  const { player, link, init } = caller;
  const name = playerName(init.user.first_name);
  const id = String(body?.duel ?? "");

  let result: unknown = null;
  switch (body?.action) {
    case "create":
      result = await createDuel(player, name, String(body.language ?? ""));
      break;
    case "info":
      result = await duelInfo(player, id);
      break;
    case "start":
      result = await startDuel(player, name, id);
      break;
    case "answer":
      result = await answerDuel(
        player,
        id,
        Number(body.index),
        Number(body.choice),
      );
      break;
    case "result": {
      const outcome = await duelResult(player, id);
      if (outcome) {
        const { notify, paid } = outcome;
        after(async () => {
          // A picture for any badge this XP unlocked.
          if (paid > 0 && link) {
            const { newAchievements } = await evaluateAchievements(
              link.userId,
              link.timeZone,
            );
            await pingAchievements(
              link.userId,
              newAchievements.map((a) => a.id),
            );
          }
          // The challenger hears how their friend did (if Telegram lets the
          // bot write to them).
          if (notify) await tellChallenger(outcome, notify);
        });
      }
      result = outcome && { ...outcome, notify: undefined };
      break;
    }
    case "recent":
      result = await recentDuels(player);
      break;
  }
  if (!result) return new Response("Bad request", { status: 400 });
  return Response.json(result);
}

type Outcome = NonNullable<Awaited<ReturnType<typeof duelResult>>>;

async function tellChallenger(
  outcome: Outcome,
  notify: NonNullable<Outcome["notify"]>,
) {
  const locale = notify.locale as AppLocale;
  const t = appTexts[locale];
  try {
    await telegram("sendMessage", {
      chat_id: notify.telegramId,
      text: duelNotice(locale, {
        name: notify.them.name,
        language: outcome.language,
        size: outcome.size,
        them: notify.them,
        you: notify.you,
        theyWon: outcome.outcome === "won",
        bonus: notify.challengerBonus,
      }),
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `⚔️ ${t.rematch}`,
              url: appLink(`duelnew_${outcome.language}`),
            },
            { text: `📊 ${t.duelRanking}`, url: appLink(`duel_${outcome.id}`) },
          ],
        ],
      },
    });
  } catch (error) {
    // Blocked the bot, or never opened a chat with it: nothing to do.
    console.error("duel notice failed", error);
  }
}
