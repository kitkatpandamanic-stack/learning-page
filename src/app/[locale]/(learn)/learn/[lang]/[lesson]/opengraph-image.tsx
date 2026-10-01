import { getTranslations } from "next-intl/server";

import { getAllLessons, getLanguage, getLessonContext } from "@/lib/content";
import { localeParam } from "@/lib/i18n";
import { ogSize, renderOgImage } from "@/lib/og";

export const alt = "PandaDev";
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllLessons().map((l) => ({ lang: l.language, lesson: l.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; lang: string; lesson: string }>;
}) {
  const { lang, lesson } = await params;
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: "levels" });
  const language = getLanguage(lang);
  const ctx = getLessonContext(lang, lesson, locale);
  return renderOgImage({
    eyebrow: ctx
      ? `${language?.name} · ${t("level", { level: ctx.level.level })} · ${t(`${ctx.level.level}.name`)}`
      : (language?.name ?? "PandaDev"),
    title: ctx?.lesson.title ?? "PandaDev",
    subtitle: ctx?.lesson.description,
  });
}
