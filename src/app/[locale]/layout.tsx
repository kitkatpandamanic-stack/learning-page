import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { JetBrains_Mono, Onest, Plus_Jakarta_Sans } from "next/font/google";

import { ServiceWorker } from "@/components/layout/service-worker";
import { SpaceBackground } from "@/components/layout/space-background";
import { MotionProvider } from "@/components/motion/motion-provider";
import { Providers } from "@/components/progress/providers";
import { routing } from "@/i18n/routing";
import { localeParam } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";
import "../globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

// Plus Jakarta Sans has no Russian letters, so Russian pages use Onest, a
// similar geometric typeface made for Cyrillic. Only Russian pages load it.
const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "cyrillic"],
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "cyrillic"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    metadataBase: new URL(siteUrl),
    title: { default: t("title"), template: "%s · PandaDev" },
    description: t("description"),
    openGraph: {
      siteName: "PandaDev",
      type: "website",
      locale: locale === "ru" ? "ru_RU" : "en_US",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("common");

  return (
    <html
      lang={locale}
      className={`${jakarta.variable} ${onest.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-full bg-gradient-brand px-5 py-2.5 font-semibold text-white focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
        >
          {t("skipToContent")}
        </a>
        <SpaceBackground />
        <NextIntlClientProvider>
          <MotionProvider>
            <Providers>{children}</Providers>
          </MotionProvider>
        </NextIntlClientProvider>
        <ServiceWorker />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
