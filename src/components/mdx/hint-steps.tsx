"use client";

import { useState, type ReactNode } from "react";
import { Lightbulb } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * An exercise's hints, opened one at a time: a nudge first, then more help,
 * so learners take only as much as they need. A single hint is one step.
 */
export function HintSteps({ hints }: { hints: ReactNode[] }) {
  const t = useTranslations("lesson");
  const [shown, setShown] = useState(0);
  const total = hints.length;
  if (total === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {hints.slice(0, shown).map((hint, i) => (
        <div
          key={i}
          className="rounded-xl border border-amber-300/20 bg-amber-300/5 px-3 py-2.5"
        >
          <p className="mb-1.5 flex items-center gap-2 text-sm font-medium text-amber-200">
            <Lightbulb className="size-4 text-amber-300" />
            {total > 1 ? t("hintStep", { step: i + 1, total }) : t("hint")}
          </p>
          <div className="flex flex-col gap-2">{hint}</div>
        </div>
      ))}
      {shown < total && (
        <button
          type="button"
          onClick={() => setShown(shown + 1)}
          className="flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/4 px-3 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/6 hover:text-white"
        >
          <Lightbulb className="size-4 text-amber-300" />
          {shown === 0
            ? total > 1
              ? t("showHint", { total })
              : t("hint")
            : t("nextHint", { step: shown + 1, total })}
        </button>
      )}
    </div>
  );
}
