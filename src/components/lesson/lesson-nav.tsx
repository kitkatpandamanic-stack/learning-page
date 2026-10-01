import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, ArrowRight, Flag } from "lucide-react";

import type { Lesson } from "#site/content";
import { GlassCard } from "@/components/ui/glass-card";

/** Previous / next lesson cards at the end of a lesson. */
export function LessonNav({
  prev,
  next,
  roadmapHref,
}: {
  prev?: Lesson;
  next?: Lesson;
  roadmapHref: string;
}) {
  const t = useTranslations("lesson");
  return (
    <nav
      aria-label={t("lessonNavigation")}
      className="grid gap-3 sm:grid-cols-2"
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

      {next ? (
        <GlassCard asChild interactive padding="sm" glow="violet">
          <Link
            href={next.permalink}
            className="flex flex-col gap-1 text-right"
          >
            <span className="flex items-center justify-end gap-1.5 text-xs text-violet-300">
              {t("upNext")} <ArrowRight className="size-3.5" />
            </span>
            <span className="font-semibold text-white">{next.title}</span>
          </Link>
        </GlassCard>
      ) : (
        <GlassCard asChild interactive padding="sm">
          <Link href={roadmapHref} className="flex flex-col gap-1 text-right">
            <span className="flex items-center justify-end gap-1.5 text-xs text-lime-300">
              <Flag className="size-3.5" /> {t("allCaughtUp")}
            </span>
            <span className="font-semibold text-white">
              {t("backToRoadmap")}
            </span>
          </Link>
        </GlassCard>
      )}
    </nav>
  );
}
