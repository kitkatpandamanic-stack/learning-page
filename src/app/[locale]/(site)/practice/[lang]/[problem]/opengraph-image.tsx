import { getTranslations } from "next-intl/server";

import { getLanguage } from "@/lib/content";
import { localeParam } from "@/lib/i18n";
import { ogSize, renderOgImage } from "@/lib/og";
import { getAllProblems, getProblemContext } from "@/lib/practice";

export const alt = "PandaDev";
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllProblems().map((p) => ({ lang: p.language, problem: p.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; lang: string; problem: string }>;
}) {
  const { lang, problem } = await params;
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: "practice" });
  const language = getLanguage(lang);
  const ctx = getProblemContext(lang, problem, locale);
  return renderOgImage({
    eyebrow: ctx
      ? `${language?.name} · ${t("eyebrow")} · ${t(`difficulty.${ctx.problem.difficulty}`)}`
      : (language?.name ?? "PandaDev"),
    title: ctx?.problem.title ?? "PandaDev",
    subtitle: ctx?.problem.description,
  });
}
