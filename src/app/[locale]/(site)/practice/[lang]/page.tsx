import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PracticeList } from "@/components/practice/practice-list";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { getLanguage } from "@/lib/content";
import { alternates, localeParam, localizedPath } from "@/lib/i18n";
import { DailyProblems } from "@/components/daily/daily-problem";
import { dailySet, getPracticeLanguages, getProblems } from "@/lib/practice";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPracticeLanguages().map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/practice/[lang]">): Promise<Metadata> {
  const locale = await localeParam(params);
  const { lang } = await params;
  const language = getLanguage(lang);
  if (!language) return {};
  const t = await getTranslations({ locale, namespace: "practice.metadata" });
  const title = t("languageTitle", { language: language.name });
  const description = t("languageDescription", {
    language: language.name,
    count: getProblems(lang).length,
  });
  const path = `/practice/${lang}`;
  return {
    title,
    description,
    alternates: alternates(path, locale),
    openGraph: { title, description, url: localizedPath(path, locale) },
  };
}

export default async function PracticeLanguagePage({
  params,
}: PageProps<"/[locale]/practice/[lang]">) {
  const locale = await localeParam(params);
  setRequestLocale(locale);
  const { lang } = await params;
  const language = getLanguage(lang);
  const problems = getProblems(lang, locale);
  if (!language || problems.length === 0) notFound();
  const t = await getTranslations("practice");

  return (
    <Container className="flex max-w-4xl flex-col gap-10 py-12 sm:py-16">
      <SectionHeading
        as="h1"
        eyebrow={t("languageEyebrow", { language: language.name })}
        title={t("languageHeading", { language: language.name })}
        description={t("languageIntro")}
      />
      <DailyProblems sets={[dailySet(lang, locale)]} />
      <PracticeList
        language={lang}
        items={problems.map((p) => ({
          slug: p.slug,
          title: p.title,
          description: p.description,
          difficulty: p.difficulty,
          topic: p.topic,
          xp: p.xp,
          permalink: p.permalink,
        }))}
      />
    </Container>
  );
}
