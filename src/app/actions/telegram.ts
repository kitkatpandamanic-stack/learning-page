"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { isLocale, localizedPath } from "@/lib/i18n";
import { getTimeZone } from "@/lib/progress";
import { createRateLimiter } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { BOT_USERNAME } from "@/lib/telegram/api";
import {
  createLinkToken,
  setLinkOption,
  unlinkUser,
  type LinkOption,
} from "@/lib/telegram/links";

const allow = createRateLimiter(20, 60_000);

async function signedInUser() {
  const session = await getSession();
  if (!session || !allow(session.user.id)) return null;
  return session.user.id;
}

/** "Connect Telegram": opens the bot with a one-time code that links the account. */
export async function connectTelegram(formData: FormData) {
  const userId = await signedInUser();
  const locale = formData.get("locale");
  if (!userId || !isLocale(locale)) return;
  const token = await createLinkToken(userId, locale, await getTimeZone());
  redirect(`https://t.me/${BOT_USERNAME}?start=${token}`);
}

export async function setTelegramOption(formData: FormData) {
  const userId = await signedInUser();
  const option = formData.get("option");
  const locale = formData.get("locale");
  if (!userId || !isLocale(locale)) return;
  if (option !== "reminders" && option !== "leaderboard") return;
  await setLinkOption(
    userId,
    option satisfies LinkOption,
    formData.get("value") === "on",
  );
  revalidatePath(localizedPath("/profile", locale));
}

export async function disconnectTelegram(formData: FormData) {
  const userId = await signedInUser();
  const locale = formData.get("locale");
  if (!userId || !isLocale(locale)) return;
  await unlinkUser(userId);
  revalidatePath(localizedPath("/profile", locale));
}
