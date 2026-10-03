"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import { cn } from "cn";

import { useProgress } from "@/components/progress/use-progress";
import { DifficultyBadge } from "@/components/practice/difficulty-badge";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import {
  difficulties,
  practiceTopics,
  type Difficulty,
  type PracticeTopic,
} from "@/lib/practice-meta";

export type PracticeItem = {
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  topic: PracticeTopic;
  xp: number;
  permalink: string;
};

function FilterGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | "all";
  options: { value: T | "all"; label: string }[];
  onChange: (value: T | "all") => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium tracking-wide text-white/50 uppercase">
        {label}
      </span>
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium text-white/70 ring-1 ring-white/10 transition hover:text-white",
              value === option.value
                ? "bg-gradient-brand text-white shadow-glow-violet ring-transparent"
                : "bg-white/5",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Problems with difficulty/topic filters and the learner's solved marks. */
export function PracticeList({
  language,
  items,
}: {
  language: string;
  items: PracticeItem[];
}) {
  const t = useTranslations("practice");
  const { data: progress } = useProgress(language);
  const [difficulty, setDifficulty] = React.useState<Difficulty | "all">("all");
  const [topic, setTopic] = React.useState<PracticeTopic | "all">("all");
  const [hideSolved, setHideSolved] = React.useState(false);

  const solved = new Set(
    (progress?.activities ?? [])
      .filter((ref) => ref.endsWith("#exercise-1"))
      .map((ref) => ref.slice(0, -"#exercise-1".length)),
  );
  const isSolved = (item: PracticeItem) => solved.has(item.permalink);
  const signedIn = progress?.signedIn === true;
  const topics = practiceTopics.filter((p) => items.some((i) => i.topic === p));

  const visible = items.filter(
    (item) =>
      (difficulty === "all" || item.difficulty === difficulty) &&
      (topic === "all" || item.topic === topic) &&
      !(hideSolved && isSolved(item)),
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5 rounded-2xl p-5 glass">
        <FilterGroup
          label={t("filters.difficulty")}
          value={difficulty}
          onChange={setDifficulty}
          options={[
            { value: "all", label: t("filters.all") },
            ...difficulties.map((d) => ({
              value: d,
              label: t(`difficulty.${d}`),
            })),
          ]}
        />
        <FilterGroup
          label={t("filters.topic")}
          value={topic}
          onChange={setTopic}
          options={[
            { value: "all", label: t("filters.all") },
            ...topics.map((p) => ({ value: p, label: t(`topics.${p}`) })),
          ]}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm">
          {signedIn ? (
            <>
              <span className="text-white/70">
                {t("solvedCount", {
                  solved: items.filter(isSolved).length,
                  total: items.length,
                })}
              </span>
              <label className="flex cursor-pointer items-center gap-2 text-white/70 select-none hover:text-white">
                <input
                  type="checkbox"
                  checked={hideSolved}
                  onChange={(e) => setHideSolved(e.target.checked)}
                  className="size-4 accent-violet-500"
                />
                {t("filters.hideSolved")}
              </label>
            </>
          ) : (
            <span className="text-white/60">
              {progress ? (
                <Link
                  href={{ pathname: "/sign-in", query: { next: "/practice" } }}
                  className="text-cyan-300 hover:underline"
                >
                  {t("signInToTrack")}
                </Link>
              ) : (
                " "
              )}
            </span>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl p-8 text-center text-white/60 glass">
          {t("empty")}
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {visible.map((item) => {
            const done = isSolved(item);
            return (
              <li key={item.slug}>
                <Link
                  href={item.permalink}
                  className="group flex items-start gap-4 rounded-2xl p-4 glass transition hover:-translate-y-0.5 hover:border-white/25 sm:items-center sm:p-5"
                >
                  {done ? (
                    <CheckCircle2
                      aria-label={t("solved")}
                      className="mt-0.5 size-6 shrink-0 text-lime-300 sm:mt-0"
                    />
                  ) : (
                    <Circle
                      aria-hidden
                      className="mt-0.5 size-6 shrink-0 text-white/20 sm:mt-0"
                    />
                  )}
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="font-semibold text-white group-hover:text-violet-200">
                      {item.title}
                    </span>
                    <span className="text-sm text-white/60">
                      {item.description}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 sm:hidden">
                      <DifficultyBadge difficulty={item.difficulty} />
                      <Badge tone="neutral">{t(`topics.${item.topic}`)}</Badge>
                    </span>
                  </span>
                  <span className="hidden shrink-0 items-center gap-2 sm:flex">
                    <Badge tone="neutral">{t(`topics.${item.topic}`)}</Badge>
                    <DifficultyBadge difficulty={item.difficulty} />
                    <span className="flex w-16 items-center justify-end gap-1 text-sm text-amber-300">
                      <Sparkles className="size-3.5" />
                      {item.xp}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
