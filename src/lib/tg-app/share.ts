import "server-only";

import { randomBytes } from "node:crypto";

import { siteUrl } from "@/lib/site";
import { BOT_USERNAME, telegram } from "@/lib/telegram/api";
import { cardQuery, type Card } from "@/lib/tg-app/card";

/** Opens the Mini App (the bot's Main Mini App, set up in @BotFather). */
export const appLink = (start?: string) =>
  `https://t.me/${BOT_USERNAME}?startapp${start ? `=${start}` : ""}`;

export const cardUrl = (card: Card) =>
  `${siteUrl}/api/tg/card?${cardQuery(card)}`;

/**
 * A message the learner can send to any chat from the app
 * (Telegram.WebApp.shareMessage): the picture, a caption, and a button that
 * opens the app. Telegram keeps it for the learner for a while; returns its id.
 */
export async function prepareShare(
  telegramId: number,
  card: Card,
  caption: string,
  start: string,
  button: string,
) {
  const photo = cardUrl({ ...card, format: "wide" });
  const prepared = await telegram<{ id: string }>("savePreparedInlineMessage", {
    user_id: telegramId,
    result: {
      type: "photo",
      id: randomBytes(8).toString("hex"),
      photo_url: photo,
      thumbnail_url: photo,
      caption,
      reply_markup: {
        inline_keyboard: [[{ text: button, url: appLink(start) }]],
      },
    },
    allow_user_chats: true,
    allow_group_chats: true,
    allow_channel_chats: true,
  });
  return prepared.id;
}
