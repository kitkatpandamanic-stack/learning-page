import "server-only";

import { randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";

import { db } from "@/db";
import { telegramLink, telegramLinkToken, user } from "@/db/schema";
import type { Locale } from "@/lib/i18n";

/** How long a "Connect Telegram" link works. */
const TOKEN_MINUTES = 15;

export type TelegramLink = typeof telegramLink.$inferSelect;
export type LinkOption = "reminders" | "leaderboard";

/**
 * A one-time code for t.me/<bot>?start=<code>. Telegram allows 64 characters
 * from A–Z, a–z, 0–9, _ and -; base64url of 18 bytes is 24 of them.
 */
export async function createLinkToken(
  userId: string,
  locale: Locale,
  timeZone: string,
) {
  const token = randomBytes(18).toString("base64url");
  await db
    .delete(telegramLinkToken)
    .where(lt(telegramLinkToken.expiresAt, new Date()));
  await db.insert(telegramLinkToken).values({
    token,
    userId,
    locale,
    timeZone,
    expiresAt: new Date(Date.now() + TOKEN_MINUTES * 60_000),
  });
  return token;
}

/**
 * Links the Telegram account that opened the bot with `token`. Each side has
 * one link: linking again replaces the learner's old Telegram account.
 */
export async function redeemLinkToken(
  token: string,
  from: { id: number; username?: string },
): Promise<
  | { ok: true; name: string; locale: Locale }
  | { ok: false; reason: "invalid" | "taken" }
> {
  if (!/^[\w-]{1,64}$/.test(token)) return { ok: false, reason: "invalid" };
  const [found] = await db
    .delete(telegramLinkToken)
    .where(
      and(
        eq(telegramLinkToken.token, token),
        gt(telegramLinkToken.expiresAt, new Date()),
      ),
    )
    .returning();
  if (!found) return { ok: false, reason: "invalid" };

  const existing = await getLinkByTelegramId(from.id);
  if (existing && existing.userId !== found.userId)
    return { ok: false, reason: "taken" };

  const values = {
    telegramId: from.id,
    username: from.username ?? null,
    locale: found.locale,
    timeZone: found.timeZone,
  };
  await db
    .insert(telegramLink)
    .values({ userId: found.userId, ...values })
    .onConflictDoUpdate({ target: telegramLink.userId, set: values });
  const [owner] = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, found.userId));
  return {
    ok: true,
    name: owner?.name.split(/\s+/)[0] ?? "",
    locale: found.locale as Locale,
  };
}

export async function getLinkByTelegramId(telegramId: number) {
  const [link] = await db
    .select()
    .from(telegramLink)
    .where(eq(telegramLink.telegramId, telegramId));
  return link ?? null;
}

export async function getLinkForUser(userId: string) {
  const [link] = await db
    .select()
    .from(telegramLink)
    .where(eq(telegramLink.userId, userId));
  return link ?? null;
}

export async function setLinkOption(
  userId: string,
  option: LinkOption,
  value: boolean,
) {
  await db
    .update(telegramLink)
    .set({ [option]: value })
    .where(eq(telegramLink.userId, userId));
}

export async function unlinkUser(userId: string) {
  await db.delete(telegramLink).where(eq(telegramLink.userId, userId));
}

export async function unlinkTelegram(telegramId: number) {
  await db.delete(telegramLink).where(eq(telegramLink.telegramId, telegramId));
}
