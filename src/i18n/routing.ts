import { defineRouting } from "next-intl/routing";

/**
 * English lives at the plain URLs (/learn/…), Russian under /ru (/ru/learn/…).
 * Visitors pick a language with the switcher; we never redirect them based
 * on their browser settings.
 */
export const routing = defineRouting({
  locales: ["en", "ru"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
