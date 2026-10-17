import { blitzResult } from "@/lib/tg-app/blitz";
import type { Card } from "@/lib/tg-app/card";
import { miniAppHome } from "@/lib/tg-app/home";
import { parseOutfit, wornOutfit } from "@/lib/tg-app/panda";
import { miniAppCaller } from "@/lib/tg-app/player";
import { appLink, cardUrl, prepareShare } from "@/lib/tg-app/share";
import { appTexts, blitzShareText } from "@/lib/tg-app/texts";

/**
 * Something to share from the Mini App, built from the server's own data
 * (never numbers from the browser):
 *   { kind: "blitz", language }  today's result in that language
 *   { kind: "panda", outfit }    the learner's panda (outfit from CloudStorage)
 * Returns a prepared message id for shareMessage, a picture for Stories, and
 * plain text for older Telegram apps.
 */
export async function POST(request: Request) {
  const caller = await miniAppCaller(request);
  if (caller instanceof Response) return caller;
  const body = (await request.json().catch(() => null)) as {
    kind?: string;
    language?: string;
    outfit?: string;
  } | null;
  const { locale, player, init } = caller;
  const t = appTexts[locale];

  let card: Card;
  let text: string;
  let start: string;
  let button: string;
  if (body?.kind === "blitz") {
    const result = await blitzResult(player, String(body.language ?? ""));
    if (!result) return new Response("Bad request", { status: 400 });
    card = {
      kind: "blitz",
      locale,
      format: "story",
      number: result.number,
      language: result.language,
      grid: result.grid,
      seconds: Math.round(result.ms / 1000),
    };
    text = blitzShareText(locale, { ...result, size: result.size });
    start = `blitz_${result.language}`;
    button = `⚡ ${t.shareButton}`;
  } else if (body?.kind === "panda") {
    const home = await miniAppHome(caller);
    if (!home.panda) return new Response("Bad request", { status: 400 });
    const p = home.panda;
    card = {
      kind: "panda",
      locale,
      format: "story",
      stage: p.stage,
      mood: p.mood,
      outfit: wornOutfit(p.unlocked, parseOutfit(body.outfit)),
      level: p.level,
      streak: p.streak,
    };
    text = `🐼 ${t.level(p.level)}${p.streak > 0 ? ` · 🔥 ${t.days(p.streak)}` : ""}`;
    start = "panda";
    button = `🐼 PandaDev`;
  } else return new Response("Bad request", { status: 400 });

  const caption = t.shareCaption(text);
  let messageId: string | null = null;
  try {
    messageId = await prepareShare(init.user.id, card, caption, start, button);
  } catch (error) {
    // Older Telegram apps: the app falls back to a t.me/share link.
    console.error("prepared message failed", error);
  }
  return Response.json({
    messageId,
    storyUrl: cardUrl(card),
    storyText: t.storyText,
    link: appLink(start),
    text: caption,
  });
}
