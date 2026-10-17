import "server-only";

import { createRateLimiter } from "@/lib/rate-limit";
import { recordSecurityEvent, requester } from "@/lib/security-events";
import { validateInitData, type InitData } from "@/lib/telegram/init-data";
import { getLinkByTelegramId, type TelegramLink } from "@/lib/telegram/links";
import { botLocale, type BotLocale } from "@/lib/telegram/texts";
import type { Player } from "@/lib/tg-app/blitz";

/** A person taps through a Blitz in a few seconds; a script gets no further. */
const allow = createRateLimiter(90, 60_000);

export type MiniAppRequest = {
  player: Player;
  init: InitData;
  link: TelegramLink | null;
  locale: BotLocale;
};

/**
 * Who is calling the Mini App's API: the app sends Telegram.WebApp.initData
 * in the X-Telegram-Init-Data header on every call (no cookies, which
 * Telegram Web's frame would drop). Returns a Response to send back when
 * the caller isn't a valid Telegram user.
 */
export async function miniAppCaller(
  request: Request,
): Promise<MiniAppRequest | Response> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return new Response("Not configured", { status: 503 });
  const init = validateInitData(
    request.headers.get("x-telegram-init-data") ?? "",
    token,
  );
  if (!init) {
    recordSecurityEvent("bad-secret", "telegram-app", await requester());
    return new Response("Forbidden", { status: 403 });
  }
  if (!allow(`tg:${init.user.id}`))
    return new Response("Too many requests", { status: 429 });
  const link = await getLinkByTelegramId(init.user.id);
  // A linked learner's site language, else their Telegram app's.
  const locale = link
    ? (link.locale as BotLocale)
    : botLocale(init.user.language_code);
  return {
    init,
    link,
    locale,
    player: { telegramId: init.user.id, userId: link?.userId ?? null, locale },
  };
}
