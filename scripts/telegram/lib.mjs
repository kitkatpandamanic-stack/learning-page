// Shared helpers for the PandaDev Telegram channel scripts. The bot token
// comes from TELEGRAM_BOT_TOKEN (.env.local locally, a repository secret on
// GitHub) and is never printed.
import { readFileSync } from "node:fs";

/** Reads .env.local when running on a laptop (GitHub passes env directly). */
export function loadEnv() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const match = /^([A-Z_]+)=(.*)$/.exec(line.trim());
      if (match && !process.env[match[1]])
        process.env[match[1]] = match[2].replace(/^"(.*)"$/, "$1");
    }
  } catch {
    // No .env.local: fine on GitHub.
  }
}

export const SITE = process.env.SITE ?? "https://pandadev-chi.vercel.app";
export const CHAT = process.env.TELEGRAM_CHAT ?? "@Kitkatpandamanic";
/** The channel's day: posts go out on Tashkent time. */
export const TIME_ZONE = "Asia/Tashkent";

export function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(
    new Date(),
  );
}

/** Calls the Bot API; throws with Telegram's message on failure. */
export async function telegram(method, body) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  const isForm = body instanceof FormData;
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: isForm ? undefined : { "content-type": "application/json" },
    body: isForm ? body : JSON.stringify(body ?? {}),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(`${method}: ${json.description}`);
  return json.result;
}

export const escapeHtml = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
