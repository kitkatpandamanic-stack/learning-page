import Link from "next/link";
import { ArrowUpRight, BookOpen, Layers } from "lucide-react";
import { cn } from "cn";

import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import type { CourseStats } from "@/lib/content";
import type { Language } from "@/lib/languages";

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
  const available = language.status === "available";
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <GlassCard
      asChild
      interactive
      className={cn("group flex h-full flex-col gap-4", language.color.border)}
    >
      <Link href={`/languages/${language.slug}`}>
        <div className="flex items-start justify-between">
          <LanguageMonogram language={language} />
          {available ? (
            <Badge tone="lime" dot>
              Available
            </Badge>
          ) : (
            <Badge tone="neutral">Coming soon</Badge>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Heading className="flex items-center gap-1.5 text-lg font-semibold text-white">
            {language.name}
            <ArrowUpRight className="size-4 text-white/40 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
          </Heading>
          <p className="text-sm text-muted-foreground">
            {language.description}
          </p>
        </div>

        <ul className="mt-auto flex flex-wrap gap-1.5">
          {language.usedFor.map((tag) => (
            <li
              key={tag}
              className="rounded-md bg-white/6 px-2 py-0.5 text-xs text-white/70"
            >
              {tag}
            </li>
          ))}
        </ul>

        {stats && (
          <div className="flex items-center gap-4 border-t border-white/10 pt-3 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <Layers className="size-3.5" /> {stats.modules} modules
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="size-3.5" />
              {stats.lessons > 0
                ? `${stats.lessons} lessons`
                : "Lessons coming soon"}
            </span>
          </div>
        )}
      </Link>
    </GlassCard>
  );
}
