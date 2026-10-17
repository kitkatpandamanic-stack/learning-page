import { setRequestLocale } from "next-intl/server";

import { localeParam } from "@/lib/i18n";

/** The Telegram Mini App: no site header or footer, Telegram has its own. */
export default async function MiniAppLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  setRequestLocale(await localeParam(params));
  return (
    <main id="main" className="flex flex-1 flex-col">
      {children}
    </main>
  );
}
