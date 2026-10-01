import { getTranslations } from "next-intl/server";

import { localeParam } from "@/lib/i18n";
import { ogSize, renderOgImage } from "@/lib/og";

export const alt = "PandaDev";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return renderOgImage({
    eyebrow: t("ogEyebrow"),
    title: t("ogTitle"),
    subtitle: t("ogSubtitle"),
  });
}
