import { useTranslations, type Messages } from "next-intl";
import { ArrowUpRight, BookOpen, Layers } from "lucide-react";
import { cn } from "cn";

import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import type { CourseStats } from "@/lib/content";
import type { Language } from "@/lib/languages";

/** Language slugs that have a description and tags in messages/<locale>/languageInfo.json. */
export type LanguageSlug = keyof Messages["languageInfo"];

/** A language's description and tags in the current interface language. */
function useLanguageInfo(language: Language) {
  const t = useTranslations("languageInfo");
  const slug = language.slug as LanguageSlug;
  return {
    description: t(`${slug}.description`),
    usedFor: t.raw(`${slug}.usedFor`) as string[],
  };
}

export function LanguageMonogram({
  language,
  className,
}: {
  language: Language;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-12 items-center justify-center rounded-xl font-mono text-lg font-bold ring-1 ring-white/10",
        language.color.soft,
        language.color.text,
        className,
      )}
    >
      {language.monogram}
    </span>
  );
}

export function LanguageCard({
  language,
  stats,
  headingLevel = 3,
}: {
  language: Language;
  /** h2 on the catalog page, h3 inside landing sections */
  headingLevel?: 2 | 3;
  /** Shown on the catalog page when the course outline exists */
  stats?: CourseStats;
}) {
  const t = useTranslations("languages.card");
  const common = useTranslations("common");
  const info = useLanguageInfo(language);
  const available = language.status === "available";
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <GlassCard
      asChild
      interactive
      className={cn("group flex h-full flex-col gap-4", language.color.border)}
    >
      <Link href={`/languages/${language.slug}`}>
        <div className="flex items-start justify-between gap-2">
          <LanguageMonogram language={language} />
          {available ? (
            <Badge tone="lime" dot>
              {common("available")}
            </Badge>
          ) : (
            <Badge tone="neutral">{common("comingSoon")}</Badge>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Heading className="flex items-center gap-1.5 text-lg font-semibold text-white">
            {language.name}
            <ArrowUpRight className="size-4 text-white/40 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
          </Heading>
          <p className="text-sm text-muted-foreground">{info.description}</p>
        </div>

        <ul className="mt-auto flex flex-wrap gap-1.5">
          {info.usedFor.map((tag) => (
            <li
              key={tag}
              className="rounded-md bg-white/6 px-2 py-0.5 text-xs text-white/70"
            >
              {tag}
            </li>
          ))}
        </ul>

        {stats && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/10 pt-3 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <Layers className="size-3.5" />{" "}
              {common("modules", { count: stats.modules })}
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="size-3.5" />
              {stats.lessons > 0
                ? common("lessons", { count: stats.lessons })
                : t("lessonsComingSoon")}
            </span>
          </div>
        )}
      </Link>
    </GlassCard>
  );
}
