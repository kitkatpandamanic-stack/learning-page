import { createHmac, timingSafeEqual } from "node:crypto";

/** The Telegram user who opened the Mini App (WebAppUser). */
export type MiniAppUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  allows_write_to_pm?: boolean;
  photo_url?: string;
};

export type InitData = {
  user: MiniAppUser;
  /** Seconds since 1970, when Telegram signed it */
  authDate: number;
  /** ?startapp=… of the link that opened the app */
  startParam?: string;
};

/** How long a launch's signed data is accepted: a day, like a session. */
export const INIT_DATA_MAX_AGE = 24 * 60 * 60;

const secretKey = (botToken: string) =>
  createHmac("sha256", "WebAppData").update(botToken).digest();

/** The data-check-string: every field but `hash`, sorted, "key=value" lines. */
function checkString(params: URLSearchParams) {
  return [...params]
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

/**
 * Checks Telegram.WebApp.initData (core.telegram.org/bots/webapps,
 * "Validating data received via the Mini App"): Telegram signs it with a key
 * made from the bot token, so only Telegram can produce it. Returns the user,
 * or null when the signature is wrong, it's too old, or there's no user.
 */
export function validateInitData(
  raw: string,
  botToken: string,
  now = Date.now(),
  maxAge = INIT_DATA_MAX_AGE,
): InitData | null {
  if (!raw || raw.length > 4096) return null;
  const params = new URLSearchParams(raw);
  const hash = params.get("hash");
  if (!hash || !/^[0-9a-f]{64}$/.test(hash)) return null;
  const expected = createHmac("sha256", secretKey(botToken))
    .update(checkString(params))
    .digest();
  if (!timingSafeEqual(expected, Buffer.from(hash, "hex"))) return null;

  const authDate = Number(params.get("auth_date"));
  const age = now / 1000 - authDate;
  if (!Number.isFinite(authDate) || age > maxAge || age < -60) return null;

  let user: MiniAppUser;
  try {
    user = JSON.parse(params.get("user") ?? "");
  } catch {
    return null;
  }
  if (!user || !Number.isSafeInteger(user.id)) return null;
  return {
    user,
    authDate,
    startParam: params.get("start_param") ?? undefined,
  };
}

/** Signs init data the way Telegram does: for tests. */
export function signInitData(fields: Record<string, string>, botToken: string) {
  const params = new URLSearchParams(fields);
  const hash = createHmac("sha256", secretKey(botToken))
    .update(checkString(params))
    .digest("hex");
  params.set("hash", hash);
  return params.toString();
}
