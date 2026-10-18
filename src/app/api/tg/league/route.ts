import {
  joinLeague,
  leagueInvite,
  leaveLeague,
  myLeagues,
  parseLeagueParam,
} from "@/lib/tg-app/league";
import { playerName } from "@/lib/tg-app/duel";
import { miniAppCaller } from "@/lib/tg-app/player";

/**
 * Group leagues:
 *   { action: "mine" }               the leagues you're in, this week's tables
 *   { action: "invite", group }      the group a link opens (group = g_<id>_<sig>)
 *   { action: "join", group }        join it (from the group's own link only)
 *   { action: "leave", chatId }      leave a league you're in
 */
export async function POST(request: Request) {
  const caller = await miniAppCaller(request);
  if (caller instanceof Response) return caller;
  const body = (await request.json().catch(() => null)) as {
    action?: string;
    group?: string;
    chatId?: number;
  } | null;
  const telegramId = caller.player.telegramId;
  // Only a link the bot made opens a league.
  const chatId = parseLeagueParam(String(body?.group ?? ""));

  let result: unknown = null;
  switch (body?.action) {
    case "mine":
      result = await myLeagues(telegramId);
      break;
    case "invite":
      result = chatId !== null && (await leagueInvite(chatId, telegramId));
      break;
    case "join":
      result = chatId !== null &&
        (await joinLeague(
          chatId,
          telegramId,
          playerName(caller.init.user.first_name),
        )) && { ok: true };
      break;
    case "leave":
      if (Number.isSafeInteger(body?.chatId)) {
        await leaveLeague(Number(body!.chatId), telegramId);
        result = { ok: true };
      }
      break;
  }
  if (!result) return new Response("Bad request", { status: 400 });
  return Response.json(result);
}
