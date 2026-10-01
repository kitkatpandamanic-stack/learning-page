import Link from "next/link";
import { ArrowLeft, ChevronRight, Trophy } from "lucide-react";
import { cn } from "cn";

import { LessonStatusIcon } from "@/components/progress/lesson-status";
import type { CourseLevel } from "@/lib/content";
import type { Language } from "@/lib/languages";
import { toneClasses } from "@/lib/tones";

/** Course outline: the current level is expanded, other levels collapse. */
export function LessonSidebar({
  language,
  levels,
  currentLevel,
  currentSlug,
}: {
  language: Language;
  levels: CourseLevel[];
  currentLevel: number;
  currentSlug: string;
}) {
  return (
    <nav aria-label={`${language.name} course`} className="flex flex-col gap-4">
      <Link
        href={`/languages/${language.slug}`}
        className="flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
      >
        <ArrowLeft className="size-4" /> {language.name} roadmap
      </Link>

      <div className="flex flex-col gap-2">
        {levels.map((level) => {
          const t = toneClasses[level.tone];
          const Icon = level.icon;
          const lessonCount = level.modules.reduce(
            (n, m) => n + m.lessons.length,
            0,
          );

          return (
            <details
              key={level.level}
              open={level.level === currentLevel}
              className="group rounded-xl"
            >
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-white/85 select-none hover:bg-white/5 [&::-webkit-details-marker]:hidden">
                <Icon className={cn("size-4", t.text)} />
                <span className="flex-1">
                  {level.level} · {level.name}
                </span>
                <span className="text-xs font-normal text-white/40">
                  {lessonCount}
                </span>
                <ChevronRight className="size-4 text-white/40 transition group-open:rotate-90" />
              </summary>

              <div className="mt-1 ml-3 flex flex-col gap-3 border-l border-white/10 pb-2 pl-3">
                {level.modules.map((module) => (
                  <div key={module.slug}>
                    <p className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium tracking-wide text-white/50 uppercase">
                      {module.capstone && (
                        <Trophy className={cn("size-3.5", t.text)} />
                      )}
                      {module.title}
                    </p>
                    {module.lessons.length > 0 ? (
                      <ul className="flex flex-col">
                        {module.lessons.map((lesson) => {
                          const active = lesson.slug === currentSlug;
                          return (
                            <li key={lesson.slug}>
                              <Link
                                href={lesson.permalink}
                                aria-current={active ? "page" : undefined}
                                className={cn(
                                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white/65 transition hover:bg-white/5 hover:text-white",
                                  active &&
                                    "bg-gradient-to-r from-neon-violet/25 to-transparent text-white",
                                )}
                              >
                                <LessonStatusIcon
                                  language={language.slug}
                                  slug={lesson.slug}
                                  active={active}
                                  activeClassName={t.text}
                                />
                                {lesson.title}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="px-2 text-xs text-white/55 italic">
                        Coming soon
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </nav>
  );
}
