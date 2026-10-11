"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Dumbbell } from "lucide-react";
import { cn } from "cn";

import { LanguageMonogram } from "@/components/languages/language-card";
import {
  DifficultyBadge,
  difficultyTone,
} from "@/components/practice/difficulty-badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Link } from "@/i18n/navigation";
import { languages } from "@/lib/languages";
import { difficulties } from "@/lib/practice-meta";
import type { PracticeSummary } from "@/lib/practice-progress";

type Item = PracticeSummary & { language: string };

/** Practice per language: solved by difficulty and topic, and what to try next. */
export function PracticeProgress({
  items,
  initial,
}: {
  items: Item[];
  initial: string;
}) {
  const t = useTranslations("dashboard.practice");
  const tp = useTranslations("practice");
  const [selected, setSelected] = React.useState(initial);
  const item = items.find((i) => i.language === selected) ?? items[0];
  if (!item) return null;
  const topicName = (topic: string) =>
    tp.has(`topics.${topic}` as never) ? tp(`topics.${topic}` as never) : topic;

  return (
    <div className="flex flex-col gap-5">
      <div
        role="group"
        aria-label={t("languages")}
        className="flex [scrollbar-width:none] gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden"
      >
        {items.map((i) => {
          const language = languages.find((l) => l.slug === i.language);
          return (
            <button
              key={i.language}
              type="button"
              aria-pressed={i.language === item.language}
              onClick={() => setSelected(i.language)}
              className="flex shrink-0 items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm text-white/65 ring-1 ring-white/10 transition hover:bg-white/8 hover:text-white aria-pressed:bg-white/12 aria-pressed:text-white aria-pressed:ring-white/25"
            >
              {language && (
                <LanguageMonogram
                  language={language}
                  className="size-6 rounded-full text-[0.6rem]"
                />
              )}
              {language?.name ?? i.language}
              <span className="font-mono text-xs text-white/45">
                {i.solved}/{i.total}
              </span>
            </button>
          );
        })}
      </div>

      <ProgressBar
        value={item.solved}
        max={item.total}
        tone="violet"
        size="lg"
        label={t("solved", { solved: item.solved, total: item.total })}
      />

      <div className="grid grid-cols-3 gap-3">
        {difficulties.map((d) => (
          <div key={d} className="flex flex-col gap-1.5">
            <span className="flex items-center justify-between text-xs text-white/60">
              {tp(`difficulty.${d}`)}
              <span className="font-mono text-white/45">
                {item.difficulty[d].solved}/{item.difficulty[d].total}
              </span>
            </span>
            <ProgressBar
              value={item.difficulty[d].solved}
              max={Math.max(item.difficulty[d].total, 1)}
              tone={difficultyTone[d]}
              size="sm"
              aria-label={`${tp(`difficulty.${d}`)}: ${item.difficulty[d].solved}/${item.difficulty[d].total}`}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-medium tracking-wide text-white/45 uppercase">
          {t("topics")}
        </h3>
        <ul className="grid grid-cols-1 gap-x-5 gap-y-2.5 sm:grid-cols-2">
          {item.topics.map((topic) => (
            <li key={topic.topic} className="flex flex-col gap-1">
              <span
                className={cn(
                  "flex items-center justify-between gap-2 text-sm",
                  topic.topic === item.focusTopic
                    ? "text-amber-200"
                    : "text-white/75",
                )}
              >
                <span className="truncate">{topicName(topic.topic)}</span>
                <span className="font-mono text-xs text-white/45">
                  {topic.solved}/{topic.total}
                </span>
              </span>
              <ProgressBar
                value={topic.solved}
                max={topic.total}
                tone={
                  topic.solved === topic.total
                    ? "lime"
                    : topic.topic === item.focusTopic
                      ? "amber"
                      : "cyan"
                }
                size="sm"
                aria-label={`${topicName(topic.topic)}: ${topic.solved}/${topic.total}`}
              />
            </li>
          ))}
        </ul>
      </div>

      {item.next ? (
        <div className="flex flex-col gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-300/15 text-amber-300">
              <Dumbbell className="size-4" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-xs text-amber-200">
                {item.solved === 0
                  ? t("startHere")
                  : t("tryNext", { topic: topicName(item.next.topic) })}
              </span>
              <span className="truncate font-semibold text-white">
                {item.next.title}
              </span>
              <span>
                <DifficultyBadge difficulty={item.next.difficulty} />
              </span>
            </div>
          </div>
          <Button asChild variant="gradient" size="sm" className="shrink-0">
            <Link href={item.next.permalink}>
              {t("solve")} <ArrowRight />
            </Link>
          </Button>
        </div>
      ) : (
        <p className="text-sm font-medium text-lime-300">{t("allSolved")}</p>
      )}
    </div>
  );
}
