import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LanguageCatalog } from "@/components/languages/language-catalog";
import { Container } from "@/components/ui/container";
import { GradientText } from "@/components/ui/gradient-text";
import { SectionHeading } from "@/components/ui/section-heading";
import { getCourseStats } from "@/lib/content";
import { alternates, localeParam } from "@/lib/i18n";
import { languages } from "@/lib/languages";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/languages">): Promise<Metadata> {
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: "languages" });
  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
    alternates: alternates("/languages", locale),
  };
}

export default async function LanguagesPage({
  params,
}: PageProps<"/[locale]/languages">) {
  const locale = await localeParam(params);
  setRequestLocale(locale);
  const t = await getTranslations("languages");

  const items = languages.map((language) => ({
    language,
    stats: getCourseStats(language.slug),
  }));

  return (
    <Container className="flex flex-col gap-12 py-12 sm:py-16">
      <SectionHeading
        as="h1"
        eyebrow={t("eyebrow")}
        title={t.rich("title", {
          gradient: (chunks) => <GradientText>{chunks}</GradientText>,
        })}
        description={t("description")}
      />
      <LanguageCatalog items={items} />
    </Container>
  );
}
