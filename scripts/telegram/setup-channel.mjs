// One-off: gives the Telegram channel PandaDev's name, description and photo,
// and posts (and pins) a welcome message. Run it again to update them.
//
//   node scripts/telegram/setup-channel.mjs            apply
//   node scripts/telegram/setup-channel.mjs --preview  print what would change
import { readFileSync } from "node:fs";

import { CHAT, loadEnv, SITE, telegram } from "./lib.mjs";

loadEnv();
const preview = process.argv.includes("--preview");

export const title = "PandaDev · Learn to code";

export const description = [
  "Учитесь программировать бесплатно: Python, JavaScript, TypeScript и SQL прямо в браузере. Каждый день — задача и вопрос дня 🐼",
  "",
  "Learn to code for free, with a daily problem and quiz.",
  `${SITE.replace(/^https:\/\//, "")}`,
].join("\n");

export const welcome = [
  "🐼 <b>PandaDev — программирование с нуля до Senior</b>",
  "Бесплатные уроки Python, JavaScript, TypeScript и SQL прямо в браузере: код запускается сразу, а задачи проверяются автоматически.",
  "",
  "Каждый день здесь:",
  "🧩 11:00 — задача дня (+20 XP на сайте)",
  "❓ 16:00 — вопрос дня в виде квиза",
  `👉 <a href="${SITE}/ru">Начать бесплатно</a>`,
  "",
  "———",
  "",
  "🐼 <b>PandaDev — learn to code from zero to senior</b>",
  "Free Python, JavaScript, TypeScript and SQL lessons in your browser: code runs instantly and exercises check themselves.",
  "",
  "Every day here (Tashkent time):",
  "🧩 11:00 — problem of the day (+20 XP on the site)",
  "❓ 16:00 — quiz question of the day",
  `👉 <a href="${SITE}">Start for free</a>`,
].join("\n");

if (preview) {
  console.log(`title (${title.length}/128):\n${title}\n`);
  console.log(`description (${description.length}/255):\n${description}\n`);
  console.log(`welcome post (pinned):\n${welcome}`);
  process.exit(0);
}

await telegram("setChatTitle", { chat_id: CHAT, title });
console.log("✓ title");
await telegram("setChatDescription", { chat_id: CHAT, description });
console.log("✓ description");
const form = new FormData();
form.append("chat_id", CHAT);
form.append(
  "photo",
  new Blob([readFileSync(new URL("./channel-photo.png", import.meta.url))], {
    type: "image/png",
  }),
  "pandadev.png",
);
await telegram("setChatPhoto", form);
console.log("✓ photo");
const post = await telegram("sendMessage", {
  chat_id: CHAT,
  text: welcome,
  parse_mode: "HTML",
  link_preview_options: { is_disabled: true },
});
await telegram("pinChatMessage", {
  chat_id: CHAT,
  message_id: post.message_id,
  disable_notification: true,
});
console.log("✓ welcome post sent and pinned");
