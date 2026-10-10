import { getTranslations } from "next-intl/server";

import { getLanguage } from "@/lib/content";
import { localeParam } from "@/lib/i18n";
import { ogSize, renderOgImage } from "@/lib/og";
import { getPracticeLanguages, getProblems } from "@/lib/practice";

export const alt = "PandaDev";
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return getPracticeLanguages().map((lang) => ({ lang }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; lang: string }>;
}) {
  const { lang } = await params;
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: "practice" });
  const meta = await getTranslations({
    locale,
    namespace: "practice.metadata",
  });
  const name = getLanguage(lang)?.name ?? lang;
  return renderOgImage({
    eyebrow: t("eyebrow"),
    title: meta("languageTitle", { language: name }),
    subtitle: meta("languageDescription", {
      language: name,
      count: getProblems(lang).length,
    }),
  });
}
