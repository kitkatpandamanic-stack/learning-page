import { getTranslations } from "next-intl/server";

import { getCourse, getLanguage } from "@/lib/content";
import { localeParam } from "@/lib/i18n";
import { languages } from "@/lib/languages";
import { levels } from "@/lib/levels";
import { ogSize, renderOgImage } from "@/lib/og";

// A static export can't depend on the locale; "PandaDev" reads the same in both languages.
export const alt = "PandaDev";
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return languages.map((l) => ({ lang: l.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; lang: string }>;
}) {
  const locale = await localeParam(params);
  const { lang } = await params;
  const t = await getTranslations({ locale, namespace: "course.og" });
  const language = getLanguage(lang);
  const course = getCourse(lang, locale);
  return renderOgImage({
    eyebrow: course
      ? t("eyebrow", { modules: course.stats.modules, levels: levels.length })
      : t("comingSoon"),
    title: language
      ? t("title", { language: language.name })
      : t("titleFallback"),
    subtitle: t("subtitle"),
  });
}
