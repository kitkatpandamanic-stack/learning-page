"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import { cn } from "cn";

import { useProgress } from "@/components/progress/use-progress";

/** Sidebar icon: check when done, dot for the current lesson, ring otherwise. */
export function LessonStatusIcon({
  language,
  slug,
  active,
  activeClassName,
}: {
  language: string;
  slug: string;
  active: boolean;
  activeClassName: string;
}) {
  const t = useTranslations("progress");
  const { data } = useProgress(language);
  if (data?.completed.includes(slug)) {
    return (
      <CheckCircle2
        aria-label={t("completed")}
        className="size-3.5 shrink-0 text-lime-300"
      />
    );
  }
  return active ? (
    <CircleDot className={cn("size-3.5 shrink-0", activeClassName)} />
  ) : (
    <Circle className="size-3.5 shrink-0 text-white/30" />
  );
}

/** Roadmap lesson number that turns into a check once completed. */
export function LessonNumber({
  language,
  slug,
  number,
  className,
}: {
  language: string;
  slug: string;
  number: number;
  className: string;
}) {
  const t = useTranslations("progress");
  const { data } = useProgress(language);
  const done = data?.completed.includes(slug);
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-semibold",
        done ? "bg-neon-lime/15 text-lime-300" : className,
      )}
    >
      {done ? (
        <CheckCircle2 aria-label={t("completed")} className="size-4" />
      ) : (
        number
      )}
    </span>
  );
}

/** "3 of 12 lessons done" bar for a course header. Hidden when signed out. */
export function CourseProgress({
  language,
  slugs,
}: {
  language: string;
  slugs: string[];
}) {
  const t = useTranslations("progress");
  const { data } = useProgress(language);
  if (!data?.signedIn || slugs.length === 0) return null;
  const done = slugs.filter((s) => data.completed.includes(s)).length;
  const percent = Math.round((done / slugs.length) * 100);

  return (
    <div className="flex w-full max-w-sm flex-col gap-1.5">
      <div className="flex justify-between gap-3 text-xs text-white/70">
        <span>{t("yourProgress")}</span>
        <span className="font-mono text-lime-300">
          {t("lessonsDone", { done, total: slugs.length })}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={slugs.length}
        aria-valuenow={done}
        aria-label={t("courseProgress")}
        className="h-2 overflow-hidden rounded-full bg-white/8"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-neon-lime to-neon-cyan shadow-glow-lime transition-[width] duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
