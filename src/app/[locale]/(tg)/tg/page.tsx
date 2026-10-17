import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { MiniApp } from "@/components/tg/mini-app";
import { localeParam } from "@/lib/i18n";
import { BOT_USERNAME } from "@/lib/telegram/api";

export const metadata: Metadata = {
  title: "PandaDev in Telegram",
  // Only useful inside Telegram, so not for search engines.
  robots: { index: false, follow: false },
};

/**
 * The Telegram Mini App (opened from @panda_learning_bot): the learner's
 * panda and the Daily Blitz. Telegram shows it in its own frame, which the
 * headers in next.config.ts allow for this page only.
 */
export default async function MiniAppPage({
  params,
}: PageProps<"/[locale]/tg">) {
  setRequestLocale(await localeParam(params));
  return <MiniApp bot={BOT_USERNAME} />;
}
