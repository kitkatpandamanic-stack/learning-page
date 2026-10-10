import { handleUpdate, type Update } from "@/lib/telegram/bot";
import { secretMatches } from "@/lib/telegram/secret";

/**
 * Telegram sends every message to the bot here (set up with
 * scripts/telegram/set-webhook.mjs). The secret header proves it's Telegram.
 */
export async function POST(request: Request) {
  if (
    !secretMatches(
      request.headers.get("x-telegram-bot-api-secret-token"),
      process.env.TELEGRAM_WEBHOOK_SECRET,
    )
  ) {
    return new Response("Forbidden", { status: 403 });
  }
  try {
    await handleUpdate((await request.json()) as Update);
  } catch (error) {
    // Telegram retries failed updates over and over: log it and move on.
    console.error("telegram update failed", error);
  }
  return new Response("ok");
}
