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

/**
 * Like prepareShare, but a text message (code doesn't fit on a picture):
 * HTML text and one button that opens the app.
 */
export async function prepareTextShare(
  telegramId: number,
  title: string,
  html: string,
  button: { text: string; url: string },
) {
  const prepared = await telegram<{ id: string }>("savePreparedInlineMessage", {
    user_id: telegramId,
    result: {
      type: "article",
      id: randomBytes(8).toString("hex"),
      title,
      input_message_content: {
        message_text: html,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      },
      reply_markup: { inline_keyboard: [[button]] },
    },
    allow_user_chats: true,
    allow_group_chats: true,
    allow_channel_chats: true,
  });
  return prepared.id;
}
