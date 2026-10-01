import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CtaSection } from "@/components/landing/cta-section";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Hero } from "@/components/landing/hero";
import { LanguagesSection } from "@/components/landing/languages-section";
import { RoadmapSection } from "@/components/landing/roadmap-section";
import { AudienceSection } from "@/components/landing/audience-section";
import { alternates, localeParam } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    title: { absolute: t("meta.title") },
    description: t("meta.description"),
    alternates: alternates("/", locale),
  };
}

export default async function Home({ params }: PageProps<"/[locale]">) {
  const locale = await localeParam(params);
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <LanguagesSection />
      <RoadmapSection />
      <DashboardPreview />
      <AudienceSection />
      <CtaSection />
    </>
  );
}
