import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChevronRight, Clock, Languages, Sparkles } from "lucide-react";
import { cn } from "cn";

import { LessonNav } from "@/components/lesson/lesson-nav";
import { LessonSidebar } from "@/components/lesson/lesson-sidebar";
import { MobileContents } from "@/components/lesson/mobile-contents";
import { TableOfContents } from "@/components/lesson/table-of-contents";
import { MDXContent } from "@/components/mdx/mdx-content";
import { CompleteLesson } from "@/components/progress/complete-lesson";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { getAllLessons, getLanguage, getLessonContext } from "@/lib/content";
import { alternates, localeParam, localizedPath } from "@/lib/i18n";
import { toneClasses } from "@/lib/tones";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllLessons().map((l) => ({ lang: l.language, lesson: l.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/learn/[lang]/[lesson]">): Promise<Metadata> {
  const { lang, lesson: slug } = await params;
  const locale = await localeParam(params);
  const language = getLanguage(lang);
  const ctx = getLessonContext(lang, slug, locale);
  if (!language || !ctx) return {};

  const title = `${ctx.lesson.title} · ${language.name}`;
  return {
    title,
    description: ctx.lesson.description,
    alternates: alternates(ctx.lesson.permalink, locale),
    openGraph: {
      title,
      description: ctx.lesson.description,
      url: localizedPath(ctx.lesson.permalink, locale),
      type: "article",
    },
  };
}

export default async function LessonPage({
  params,
}: PageProps<"/[locale]/learn/[lang]/[lesson]">) {
  const { lang, lesson: slug } = await params;
  const locale = await localeParam(params);
  setRequestLocale(locale);
  const language = getLanguage(lang);
  const ctx = getLessonContext(lang, slug, locale);
  if (!language || !ctx) notFound();
  const tr = await getTranslations("lesson");
  const levelNames = await getTranslations("levels");

  const { lesson, module, level, levels } = ctx;
  const t = toneClasses[level.tone];
  const lessonNumber =
    module.lessons.findIndex((l) => l.slug === lesson.slug) + 1;
  const roadmapHref = `/languages/${language.slug}`;

  const sidebar = (
    <LessonSidebar
      language={language}
      levels={levels}
      currentLevel={level.level}
      currentSlug={lesson.slug}
    />
  );

  return (
    <div className="mx-auto grid w-full max-w-[90rem] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:px-8 xl:grid-cols-[17rem_minmax(0,1fr)_14rem]">
      <aside
        aria-label={tr("courseContents")}
        className="sticky top-24 hidden max-h-[calc(100vh-7rem)] self-start overflow-y-auto rounded-2xl p-4 glass lg:block"
      >
        {sidebar}
      </aside>

      <article className="mx-auto w-full max-w-3xl min-w-0">
        {/* Breadcrumbs */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <nav
            aria-label={tr("breadcrumb")}
            className="flex flex-wrap items-center gap-1 text-sm text-white/50"
          >
            <Link href="/languages" className="hover:text-white">
              {tr("languages")}
            </Link>
            <ChevronRight className="size-3.5" />
            <Link href={roadmapHref} className="hover:text-white">
              {language.name}
            </Link>
            <ChevronRight className="size-3.5" />
            <Link
              href={`${roadmapHref}#level-${level.level}`}
              className="hover:text-white"
            >
              {levelNames(`${level.level}.name`)}
            </Link>
            <ChevronRight className="size-3.5" />
            <span className="text-white/75">{module.title}</span>
          </nav>
          <MobileContents>{sidebar}</MobileContents>
        </div>

        {/* Lesson header */}
        <header className="mb-10 flex flex-col gap-4 border-b border-white/10 pb-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={level.tone} dot>
              {levelNames("level", { level: level.level })} ·{" "}
              {levelNames(`${level.level}.name`)}
            </Badge>
            <span className={cn("font-mono text-xs", t.text)}>
              {module.capstone
                ? tr("capstonePart", {
                    part: lessonNumber,
                    total: module.lessons.length,
                  })
                : tr("moduleLesson", {
                    module: module.number,
                    lesson: lessonNumber,
                    total: module.lessons.length,
                  })}
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            {lesson.title}
          </h1>
          <p className="text-lg text-muted-foreground">{lesson.description}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" />{" "}
              {tr("minutes", { count: lesson.duration })}
            </span>
            <span className="flex items-center gap-1.5 text-amber-300">
              <Sparkles className="size-4" /> {lesson.xp} XP
            </span>
            <span>
              {tr("positionInCourse", {
                position: ctx.position,
                total: ctx.total,
              })}
            </span>
          </div>
          {lesson.locale !== locale && (
            <p className="flex items-center gap-2 rounded-xl bg-white/6 px-3 py-2 text-sm text-white/70 ring-1 ring-white/10">
              <Languages className="size-4 shrink-0 text-cyan-300" />
              {tr("notTranslated")}
            </p>
          )}
        </header>

        <div className="lesson-prose prose max-w-none prose-invert prose-headings:scroll-mt-28 prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-white prose-h2:mt-12 prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-p:text-white/80 prose-a:text-cyan-300 prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-li:text-white/80 prose-li:marker:text-violet-400 prose-table:text-sm prose-th:text-white prose-td:text-white/75">
          <MDXContent code={lesson.body} />
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8">
          <CompleteLesson
            language={language.slug}
            slug={lesson.slug}
            permalink={lesson.permalink}
            xp={lesson.xp}
            next={
              ctx.next
                ? { title: ctx.next.title, href: ctx.next.permalink }
                : undefined
            }
          />
          <LessonNav
            prev={ctx.prev}
            next={ctx.next}
            roadmapHref={roadmapHref}
          />
        </div>
      </article>

      <aside
        aria-label={tr("onThisPage")}
        className="sticky top-24 hidden self-start xl:block"
      >
        <TableOfContents toc={lesson.toc} />
      </aside>
    </div>
  );
}
