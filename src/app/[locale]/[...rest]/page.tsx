import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { localeParam } from "@/lib/i18n";

// Not-found pages can't set their own title, so unknown URLs get it here.
export async function generateMetadata({
  params,
}: PageProps<"/[locale]/[...rest]">): Promise<Metadata> {
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: "notFound" });
  return { title: t("metaTitle"), robots: { index: false } };
}

/** Any unknown URL shows the localized 404 page. */
export default function CatchAll() {
  notFound();
}
