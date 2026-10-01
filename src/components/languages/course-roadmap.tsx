import { useTranslations } from "next-intl";
import { Clock, Hammer, PenLine, Trophy } from "lucide-react";
import { cn } from "cn";

import { Link } from "@/i18n/navigation";
import { LessonNumber } from "@/components/progress/lesson-status";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import type { CourseLevel, CourseModule } from "@/lib/content";
import { toneClasses, type Tone } from "@/lib/tones";

function ModuleCard({ module, tone }: { module: CourseModule; tone: Tone }) {
  const t = toneClasses[tone];
  const tr = useTranslations("course.roadmap");
  const common = useTranslations("common");

  return (
    <GlassCard className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn("font-mono text-xs tracking-wider uppercase", t.text)}
        >
          {tr("module", { number: module.number })}
        </span>
        {module.lessons.length > 0 && (
          <Badge tone="neutral">
            {common("lessons", { count: module.lessons.length })}
          </Badge>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white">{module.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {module.description}
        </p>
      </div>

      {module.lessons.length > 0 ? (
        <ol className="flex flex-col gap-1">
          {module.lessons.map((lesson, i) => (
            <li key={lesson.slug}>
              <Link
                href={lesson.permalink}
                className="group flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-white/6"
              >
                <LessonNumber
                  language={lesson.language}
                  slug={lesson.slug}
                  number={i + 1}
                  className={cn(t.soft, t.text)}
                />
                <span className="flex-1 text-sm text-white/85 group-hover:text-white">
                  {lesson.title}
                </span>
                <span className="flex shrink-0 items-center gap-1 text-xs text-white/45">
                  <Clock className="size-3" />
                  {common("minutes", { count: lesson.duration })}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="flex items-center gap-2 rounded-xl border border-dashed border-white/15 px-3 py-2.5 text-sm text-white/50">
          <PenLine className="size-4" /> {tr("lessonsBeingWritten")}
        </p>
      )}

      {module.project && (
        <p className="mt-auto flex items-center gap-2 border-t border-white/10 pt-3 text-sm text-white/75">
          <Hammer className={cn("size-4", t.text)} />
          <span>
            <span className="text-white/50">{tr("miniProject")}</span>{" "}
            {module.project}
          </span>
        </p>
      )}
    </GlassCard>
  );
}

export function CourseRoadmap({ levels }: { levels: CourseLevel[] }) {
  const tr = useTranslations("course.roadmap");
  const tl = useTranslations("levels");
  const common = useTranslations("common");

  return (
    <div className="flex flex-col">
      {levels.map((level, index) => {
        const t = toneClasses[level.tone];
        const Icon = level.icon;
        const isLast = index === levels.length - 1;
        const capstone = level.modules.find((m) => m.capstone);

        return (
          <section
            key={level.level}
            id={`level-${level.level}`}
            aria-labelledby={`level-${level.level}-title`}
            className="relative scroll-mt-28 pb-14 pl-16 sm:pl-20"
          >
            {/* Timeline */}
            {!isLast && (
              <div
                aria-hidden
                className={cn(
                  "absolute top-14 bottom-0 left-[27px] w-0.5 bg-gradient-to-b to-transparent opacity-60",
                  t.gradient,
                )}
              />
            )}
            <span
              className={cn(
                "absolute top-0 left-0 flex size-14 items-center justify-center rounded-2xl border bg-space-900 [&_svg]:size-6",
                t.border,
                t.text,
                t.glow,
              )}
            >
              <Icon />
            </span>

            <header className="mb-6 flex flex-col gap-1">
              <p
                className={cn(
                  "font-mono text-xs tracking-wider uppercase",
                  t.text,
                )}
              >
                {tl("level", { level: level.level })}
              </p>
              <h2
                id={`level-${level.level}-title`}
                className="text-2xl font-bold text-white sm:text-3xl"
              >
                {tl(`${level.level}.name`)}{" "}
                <span className="text-lg font-medium text-white/50">
                  · {tl(`${level.level}.tagline`)}
                </span>
              </h2>
              <p className="max-w-2xl text-muted-foreground">{level.summary}</p>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
              {level.modules
                .filter((m) => !m.capstone)
                .map((module) => (
                  <ModuleCard
                    key={module.slug}
                    module={module}
                    tone={level.tone}
                  />
                ))}
            </div>

            <div
              className={cn(
                "mt-4 rounded-2xl bg-gradient-to-r p-px",
                t.gradient,
              )}
            >
              <div className="flex flex-col gap-4 rounded-[calc(1rem-1px)] bg-space-900/90 px-5 py-4 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl",
                      t.soft,
                      t.text,
                    )}
                  >
                    <Trophy className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-white/55">
                      {tr("capstone", { level: level.level })}
                    </p>
                    <h3 className="font-semibold text-white">
                      {level.capstone}
                    </h3>
                  </div>
                  {capstone && capstone.lessons.length > 0 && (
                    <Badge tone="neutral" className="shrink-0">
                      {common("parts", { count: capstone.lessons.length })}
                    </Badge>
                  )}
                </div>
                {capstone?.description && (
                  <p className="text-sm text-muted-foreground">
                    {capstone.description}
                  </p>
                )}
                {capstone && capstone.lessons.length > 0 && (
                  <ol className="grid gap-1 sm:grid-cols-2">
                    {capstone.lessons.map((lesson, i) => (
                      <li key={lesson.slug}>
                        <Link
                          href={lesson.permalink}
                          className="group flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-white/6"
                        >
                          <LessonNumber
                            language={lesson.language}
                            slug={lesson.slug}
                            number={i + 1}
                            className={cn(t.soft, t.text)}
                          />
                          <span className="flex-1 text-sm text-white/85 group-hover:text-white">
                            {lesson.title}
                          </span>
                          <span className="flex shrink-0 items-center gap-1 text-xs text-white/45">
                            <Clock className="size-3" />
                            {common("minutes", { count: lesson.duration })}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
