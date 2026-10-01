import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { namespaces } from "./namespaces";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;
  const files = await Promise.all(
    namespaces.map(
      async (ns) =>
        [
          ns,
          (await import(`../../messages/${locale}/${ns}.json`)).default,
        ] as const,
    ),
  );
  // Dates are formatted the same on the server and in the browser.
  return { locale, messages: Object.fromEntries(files), timeZone: "UTC" };
});
