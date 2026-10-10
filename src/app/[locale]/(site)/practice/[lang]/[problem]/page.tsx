import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronRight,
  Languages,
  ListChecks,
  Sparkles,
} from "lucide-react";

import { BookmarkButton } from "@/components/learning/bookmark-button";
import { VisitTracker } from "@/components/learning/visit-tracker";
import { MDXContent } from "@/components/mdx/mdx-content";
import { lessonProseClass } from "@/components/mdx/prose";
import { DifficultyBadge } from "@/components/practice/difficulty-badge";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { GlassCard } from "@/components/ui/glass-card";
import { Link } from "@/i18n/navigation";
import { getLanguage, getLessonContext } from "@/lib/content";
import { alternates, localeParam, localizedPath } from "@/lib/i18n";
import { loadProblemBody } from "@/lib/lesson-body";
import { getAllProblems, getProblemContext } from "@/lib/practice";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllProblems().map((p) => ({ lang: p.language, problem: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/practice/[lang]/[problem]">): Promise<Metadata> {
  const { lang, problem: slug } = await params;
  const locale = await localeParam(params);
  const language = getLanguage(lang);
  const ctx = getProblemContext(lang, slug, locale);
  if (!language || !ctx) return {};
  const title = `${ctx.problem.title} · ${language.name}`;
  return {
    title,
    description: ctx.problem.description,
    alternates: alternates(ctx.problem.permalink, locale),
    openGraph: {
      title,
      description: ctx.problem.description,
      url: localizedPath(ctx.problem.permalink, locale),
      type: "article",
    },
  };
}

export default async function ProblemPage({
  params,
}: PageProps<"/[locale]/practice/[lang]/[problem]">) {
  const { lang, problem: slug } = await params;
  const locale = await localeParam(params);
  setRequestLocale(locale);
  const language = getLanguage(lang);
  const ctx = getProblemContext(lang, slug, locale);
  if (!language || !ctx) notFound();
  const t = await getTranslations("practice");
  const tl = await getTranslations("lesson");
  const { problem, prev, next } = ctx;
  const body = await loadProblemBody(problem);
  const listHref = `/practice/${lang}`;
  const lesson = problem.lesson
    ? getLessonContext(lang, problem.lesson.split("/").at(-1)!, locale)?.lesson
    : undefined;

  return (
    <Container className="max-w-3xl py-8 sm:py-12">
      <nav
        aria-label={t("breadcrumb")}
        className="mb-6 flex flex-wrap items-center gap-1 text-sm text-white/50"
      >
        <Link href="/practice" className="hover:text-white">
          {t("eyebrow")}
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={listHref} className="hover:text-white">
          {language.name}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-white/75">{problem.title}</span>
      </nav>

      <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={problem.difficulty} />
          <Badge tone="neutral">{t(`topics.${problem.topic}`)}</Badge>
          <span className="flex items-center gap-1.5 text-sm text-amber-300">
            <Sparkles className="size-4" /> {t("xp", { xp: problem.xp })}
          </span>
          <span className="font-mono text-xs text-white/50">
            {t("position", { position: ctx.position, total: ctx.total })}
          </span>
          <BookmarkButton permalink={problem.permalink} className="ml-auto" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          {problem.title}
        </h1>
        {problem.locale !== locale && (
          <p className="flex items-center gap-2 rounded-xl bg-white/6 px-3 py-2 text-sm text-white/70 ring-1 ring-white/10">
            <Languages className="size-4 shrink-0 text-cyan-300" />
            {tl("notTranslated")}
          </p>
        )}
        {lesson && (
          <Link
            href={lesson.permalink}
            className="flex items-center gap-2 self-start text-sm text-cyan-300 hover:underline"
          >
            <BookOpen className="size-4" />
            {t("refresher")}: {lesson.title}
          </Link>
        )}
      </header>
      <VisitTracker permalink={problem.permalink} title={problem.title} />

      <div className={lessonProseClass}>
        <MDXContent code={body} />
      </div>

      <nav
        aria-label={t("allProblems")}
        className="mt-12 grid gap-3 border-t border-white/10 pt-8 sm:grid-cols-3"
      >
        {prev ? (
          <GlassCard asChild interactive padding="sm">
            <Link href={prev.permalink} className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-xs text-white/50">
                <ArrowLeft className="size-3.5" /> {t("previous")}
              </span>
              <span className="font-semibold text-white">{prev.title}</span>
            </Link>
          </GlassCard>
        ) : (
          <span className="hidden sm:block" />
        )}
        <GlassCard asChild interactive padding="sm">
          <Link
            href={listHref}
            className="flex flex-col items-center justify-center gap-1 text-center"
          >
            <ListChecks className="size-5 text-violet-300" />
            <span className="font-semibold text-white">{t("allProblems")}</span>
          </Link>
        </GlassCard>
        {next ? (
          <GlassCard asChild interactive padding="sm" glow="violet">
            <Link
              href={next.permalink}
              className="flex flex-col gap-1 text-right"
            >
              <span className="flex items-center justify-end gap-1.5 text-xs text-violet-300">
                {t("next")} <ArrowRight className="size-3.5" />
              </span>
              <span className="font-semibold text-white">{next.title}</span>
            </Link>
          </GlassCard>
        ) : (
          <span className="hidden sm:block" />
        )}
      </nav>
    </Container>
  );
}
