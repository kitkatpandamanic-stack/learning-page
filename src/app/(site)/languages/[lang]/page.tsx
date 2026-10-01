import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  Layers,
  Mountain,
  PenLine,
} from "lucide-react";
import { cn } from "cn";

import { CourseRoadmap } from "@/components/languages/course-roadmap";
import { LanguageMonogram } from "@/components/languages/language-card";
import { CourseProgress } from "@/components/progress/lesson-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { getCourse, getLanguage } from "@/lib/content";
import { languages } from "@/lib/languages";
import { levels } from "@/lib/levels";
import { siteConfig, siteUrl } from "@/lib/site";
import { toneClasses } from "@/lib/tones";

export const dynamicParams = false;

export function generateStaticParams() {
  return languages.map((l) => ({ lang: l.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/languages/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const language = getLanguage(lang);
  if (!language) return {};

  const title = `Learn ${language.name}: Zero to Senior roadmap`;
  const description =
    getCourse(lang)?.intro ??
    `${language.description} The full ${language.name} course is coming soon to PandaDev.`;

  return {
    title,
    description,
    alternates: { canonical: `/languages/${lang}` },
    openGraph: { title, description, url: `/languages/${lang}` },
  };
}

function formatHours(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${hours} h`;
}

export default async function LanguagePage({
  params,
}: PageProps<"/languages/[lang]">) {
  const { lang } = await params;
  const language = getLanguage(lang);
  if (!language) notFound();

  const course = getCourse(lang);

  const jsonLd = course && {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `${language.name}: from Zero to Senior`,
    description: course.intro,
    url: `${siteUrl}/languages/${lang}`,
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
      sameAs: siteUrl,
    },
  };

  return (
    <Container className="flex flex-col gap-10 py-10 sm:py-14">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}

      <Link
        href="/languages"
        className="inline-flex items-center gap-2 self-start text-sm text-white/60 transition hover:text-white"
      >
        <ArrowLeft className="size-4" /> All languages
      </Link>

      {/* Course header */}
      <GlassCard
        variant="strong"
        padding="lg"
        className="relative overflow-hidden"
      >
        <div
          aria-hidden
          className={cn(
            "absolute -top-24 -right-16 size-72 rounded-full opacity-30 blur-[90px]",
            language.color.bg,
          )}
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <LanguageMonogram
              language={language}
              className="size-20 rounded-2xl text-3xl"
            />
            <div className="flex max-w-2xl flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                  Learn <GradientText>{language.name}</GradientText>
                </h1>
                {language.status === "available" ? (
                  <Badge tone="lime" dot>
                    Available
                  </Badge>
                ) : (
                  <Badge tone="neutral">Coming soon</Badge>
                )}
              </div>
              <p className="text-muted-foreground sm:text-lg">
                {course?.intro ?? language.description}
              </p>
              <ul className="flex flex-wrap gap-2 text-sm text-white/75">
                <li className="flex items-center gap-1.5 rounded-full px-3 py-1 glass">
                  <Mountain className="size-3.5" /> 4 levels
                </li>
                {course && (
                  <li className="flex items-center gap-1.5 rounded-full px-3 py-1 glass">
                    <Layers className="size-3.5" /> {course.stats.modules}{" "}
                    modules
                  </li>
                )}
                {course && course.stats.lessons > 0 && (
                  <>
                    <li className="flex items-center gap-1.5 rounded-full px-3 py-1 glass">
                      <BookOpen className="size-3.5" /> {course.stats.lessons}{" "}
                      lessons
                    </li>
                    <li className="flex items-center gap-1.5 rounded-full px-3 py-1 glass">
                      <Clock className="size-3.5" />{" "}
                      {formatHours(course.stats.minutes)}
                    </li>
                  </>
                )}
              </ul>
              {course && (
                <CourseProgress
                  language={language.slug}
                  slugs={course.levels.flatMap((l) =>
                    l.modules.flatMap((m) => m.lessons.map((x) => x.slug)),
                  )}
                />
              )}
            </div>
          </div>

          {course?.firstLesson ? (
            <Button asChild variant="gradient" size="xl" className="shrink-0">
              <Link href={course.firstLesson.permalink}>
                Start first lesson <ArrowRight />
              </Link>
            </Button>
          ) : (
            <Button variant="glass" size="xl" disabled className="shrink-0">
              <PenLine /> Lessons coming soon
            </Button>
          )}
        </div>
      </GlassCard>

      {/* Jump to a level */}
      <nav aria-label="Levels" className="flex flex-wrap gap-2">
        {levels.map((level) => {
          const t = toneClasses[level.tone];
          const Icon = level.icon;
          return (
            <a
              key={level.level}
              href={`#level-${level.level}`}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white/80 glass transition hover:text-white",
                course ? "" : "pointer-events-none opacity-60",
              )}
            >
              <Icon className={cn("size-4", t.text)} />
              {level.level} · {level.name}
            </a>
          );
        })}
      </nav>

      {course ? (
        <CourseRoadmap levels={course.levels} />
      ) : (
        <ComingSoon languageName={language.name} />
      )}
    </Container>
  );
}

function ComingSoon({ languageName }: { languageName: string }) {
  const ready = languages.filter((l) => l.status === "available");

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {levels.map((level) => {
          const t = toneClasses[level.tone];
          const Icon = level.icon;
          return (
            <GlassCard key={level.level} className="flex flex-col gap-3">
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  t.soft,
                  t.text,
                )}
              >
                <Icon className="size-5" />
              </span>
              <div>
                <p className={cn("font-mono text-xs uppercase", t.text)}>
                  Level {level.level}
                </p>
                <h2 className="text-lg font-semibold text-white">
                  {level.name}
                </h2>
              </div>
              <ul className="flex flex-col gap-1.5 text-sm text-white/70">
                {level.topics.map((topic) => (
                  <li key={topic}>· {topic}</li>
                ))}
              </ul>
            </GlassCard>
          );
        })}
      </div>

      <GlassCard
        glow="violet"
        className="flex flex-col items-center gap-4 text-center"
      >
        <PenLine className="size-8 text-violet-300" />
        <div>
          <h2 className="text-xl font-bold text-white">
            The {languageName} course is being written
          </h2>
          <p className="mt-1 text-muted-foreground">
            In the meantime, these courses are ready for you:
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {ready.map((l) => (
            <Button key={l.slug} asChild variant="glass">
              <Link href={`/languages/${l.slug}`}>{l.name}</Link>
            </Button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
