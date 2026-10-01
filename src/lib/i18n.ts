import { routing, type Locale } from "@/i18n/routing";

export type { Locale };
export const locales = routing.locales;
export const defaultLocale = routing.defaultLocale;

export function isLocale(value: unknown): value is Locale {
  return (locales as readonly unknown[]).includes(value);
}

/** "/learn/x" in Russian is "/ru/learn/x"; English keeps the plain path. */
export function localizedPath(path: string, locale: Locale) {
  if (locale === defaultLocale) return path;
  return `/${locale}${path === "/" ? "" : path}`;
}

/** Canonical URL plus hreflang links to the same page in every language. */
export function alternates(path: string, locale: Locale) {
  return {
    canonical: localizedPath(path, locale),
    languages: {
      ...Object.fromEntries(locales.map((l) => [l, localizedPath(path, l)])),
      "x-default": path,
    },
  };
}

/** The page's locale from its route params (the proxy guarantees a valid one). */
export async function localeParam(
  params: Promise<{ locale: string }>,
): Promise<Locale> {
  const { locale } = await params;
  return isLocale(locale) ? locale : defaultLocale;
}
