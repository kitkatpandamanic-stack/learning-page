"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, Sparkles } from "lucide-react";

import { LanguageMonogram } from "@/components/languages/language-card";
import { DifficultyBadge } from "@/components/practice/difficulty-badge";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { Link } from "@/i18n/navigation";
import { DAILY_BONUS_XP, dailyIndex, dailyProblem } from "@/lib/daily";
import { languages } from "@/lib/languages";
import type { Difficulty } from "@/lib/practice-meta";

export type DailySet = {
  language: string;
  /** The language's problems in their fixed order */
  problems: { permalink: string; title: string; difficulty: Difficulty }[];
};

const noChange = () => () => {};
const localToday = () => new Intl.DateTimeFormat("en-CA").format(new Date());

/** Today's date in the visitor's time zone; null while the page is pre-rendered. */
function useToday() {
  return React.useSyncExternalStore(noChange, localToday, () => null);
}

/** Today's problem in each language, for the practice pages. */
export function DailyProblems({ sets }: { sets: DailySet[] }) {
  const t = useTranslations("practice.daily");
  const today = useToday();
  return (
    <section aria-labelledby="daily-title" className="flex flex-col gap-3">
      <div>
        <h2
          id="daily-title"
          className="flex items-center gap-2 text-xl font-bold text-white"
        >
          <CalendarDays className="size-5 text-amber-300" /> {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("hint", { xp: DAILY_BONUS_XP })}
        </p>
      </div>
      <ul
        className={sets.length > 1 ? "grid gap-3 sm:grid-cols-2" : "grid gap-3"}
      >
        {sets.map((set) => {
          const problem = today
            ? dailyProblem(today, set.language, set.problems)
            : undefined;
          const language = languages.find((l) => l.slug === set.language);
          return (
            <li key={set.language}>
              <GlassCard
                asChild
                interactive
                padding="sm"
                glow="amber"
                className="flex min-h-18 items-center gap-3"
              >
                <Link href={problem?.permalink ?? `/practice/${set.language}`}>
                  {language && (
                    <LanguageMonogram
                      language={language}
                      className="size-11 shrink-0 text-sm"
                    />
                  )}
                  {problem ? (
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-white">
                        {problem.title}
                      </span>
                      <span className="flex items-center gap-2 text-xs text-amber-300">
                        <DifficultyBadge difficulty={problem.difficulty} />
                        <Sparkles className="size-3.5" /> +{DAILY_BONUS_XP} XP
                      </span>
                    </span>
                  ) : (
                    <span className="h-9 w-40 animate-pulse rounded-lg bg-white/8" />
                  )}
                </Link>
              </GlassCard>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** A badge on a problem's page when it's today's problem of the day. */
export function DailyBadge({
  language,
  position,
  count,
}: {
  language: string;
  /** This problem's place in the language's fixed order */
  position: number;
  count: number;
}) {
  const t = useTranslations("practice.daily");
  const today = useToday();
  if (!today || dailyIndex(today, language, count) !== position) return null;
  return (
    <Badge tone="amber" dot title={t("bonus", { xp: DAILY_BONUS_XP })}>
      {t("badge")} · +{DAILY_BONUS_XP} XP
    </Badge>
  );
}
