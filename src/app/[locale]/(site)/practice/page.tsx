import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import { LanguageMonogram } from "@/components/languages/language-card";
import { Container } from "@/components/ui/container";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { SectionHeading } from "@/components/ui/section-heading";
import { Link } from "@/i18n/navigation";
import { getLanguage } from "@/lib/content";
import { alternates, localeParam } from "@/lib/i18n";
import { getPracticeLanguages, getProblems } from "@/lib/practice";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/practice">): Promise<Metadata> {
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: "practice.metadata" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: alternates("/practice", locale),
  };
}

export default async function PracticePage({
  params,
}: PageProps<"/[locale]/practice">) {
  const locale = await localeParam(params);
  setRequestLocale(locale);
  const t = await getTranslations("practice");

  const sets = getPracticeLanguages().flatMap((slug) => {
    const language = getLanguage(slug);
    if (!language) return [];
    const problems = getProblems(slug, locale);
    const count = (d: string) =>
      problems.filter((p) => p.difficulty === d).length;
    return [
      {
        language,
        total: problems.length,
        easy: count("easy"),
        medium: count("medium"),
        hard: count("hard"),
      },
    ];
  });

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
      <div className="mx-auto grid w-full max-w-3xl gap-6">
        {sets.map(({ language, total, easy, medium, hard }) => (
          <GlassCard key={language.slug} asChild interactive padding="lg">
            <Link
              href={`/practice/${language.slug}`}
              className="flex flex-col gap-5 sm:flex-row sm:items-center"
            >
              <LanguageMonogram language={language} className="size-16" />
              <span className="flex flex-1 flex-col gap-1">
                <span className="text-2xl font-bold text-white">
                  {t("languageHeading", { language: language.name })}
                </span>
                <span className="text-white/70">
                  {t("problemCount", { count: total })}
                </span>
                <span className="text-sm text-white/50">
                  {t("byDifficulty", { easy, medium, hard })}
                </span>
              </span>
              <span className="flex items-center gap-2 font-semibold text-violet-300">
                {t("start")} <ArrowRight className="size-4" />
              </span>
            </Link>
          </GlassCard>
        ))}
        <p className="text-center text-sm text-white/50">{t("moreSoon")}</p>
      </div>
    </Container>
  );
}
