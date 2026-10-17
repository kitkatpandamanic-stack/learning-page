import "server-only";

/** The bot's username, for t.me links (not a secret). */
export const BOT_USERNAME =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT ?? "panda_learning_bot";
/** The channel the weekly leaderboard is posted to. */
export const CHANNEL = process.env.TELEGRAM_CHANNEL ?? "@Kitkatpandamanic";
/** The channel's clock: the daily post and the leaderboard go by Tashkent time. */
export const CHANNEL_TIME_ZONE = "Asia/Tashkent";

export const telegramConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN);

export class TelegramError extends Error {
  constructor(
    method: string,
    readonly code: number,
    description: string,
  ) {
    super(`${method}: ${description}`);
  }
}

/** Calls a Bot API method; throws TelegramError when Telegram says no. */
export async function telegram<T = unknown>(
  method: string,
  body: Record<string, unknown>,
): Promise<T> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  const response = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  const data = (await response.json()) as {
    ok: boolean;
    result?: T;
    error_code?: number;
    description?: string;
  };
  if (!data.ok) {
    throw new TelegramError(
      method,
      data.error_code ?? response.status,
      data.description ?? "failed",
    );
  }
  return data.result as T;
}

/** Sends an HTML message without link previews. */
export function sendMessage(
  chatId: number | string,
  text: string,
  extra: Record<string, unknown> = {},
) {
  return telegram("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    ...extra,
  });
}
