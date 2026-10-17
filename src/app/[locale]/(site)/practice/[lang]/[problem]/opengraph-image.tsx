import { getTranslations } from "next-intl/server";

import { getLanguage } from "@/lib/content";
import { localeParam } from "@/lib/i18n";
import { ogSize, renderOgImage } from "@/lib/og";
import { getProblemContext } from "@/lib/practice";

export const alt = "PandaDev";
export const size = ogSize;
export const contentType = "image/png";

// Drawn the first time a link is shared, then kept until the next deploy
// (prerendering one per page made deployments much bigger).
export function generateStaticParams() {
  return [];
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
