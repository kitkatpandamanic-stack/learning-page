"use client";

import * as React from "react";
import { CheckCircle2, HelpCircle, RotateCcw, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "cn";

import { usePathname } from "@/i18n/navigation";

import { languageFromPath, useAward } from "@/components/progress/use-progress";
import { Button } from "@/components/ui/button";

export function Quiz({
  question,
  options,
  answer,
  explanation,
  activityId,
}: {
  question: string;
  options: string[];
  /** Index of the correct option (0-based) */
  answer: number;
  explanation?: string;
  /** Added at build time ("quiz-1", …); used to award XP once */
  activityId?: string;
}) {
  const pathname = usePathname();
  const award = useAward(languageFromPath(pathname));
  const t = useTranslations("lesson.quiz");
  const attempts = React.useRef(0);
  const id = React.useId();
  const [selected, setSelected] = React.useState<number | null>(null);
  const [checked, setChecked] = React.useState(false);
  const correct = checked && selected === answer;

  return (
    <fieldset className="not-prose my-8 rounded-2xl p-5 glass">
      <legend className="sr-only">{t("label")}</legend>
      <p className="flex items-start gap-2 font-semibold text-white">
        <HelpCircle className="mt-0.5 size-5 shrink-0 text-cyan-300" />
        {question}
      </p>

      <div className="mt-4 flex flex-col gap-2">
        {options.map((option, i) => {
          const isSelected = selected === i;
          const showRight = checked && i === answer;
          const showWrong = checked && isSelected && i !== answer;
          return (
            <label
              key={i}
              htmlFor={`${id}-${i}`}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm text-white/85 transition",
                "border-white/10 bg-white/4 hover:border-white/25 hover:bg-white/8",
                isSelected &&
                  !checked &&
                  "border-neon-violet/60 bg-neon-violet/12",
                showRight && "border-neon-lime/60 bg-neon-lime/12",
                showWrong && "border-rose-400/60 bg-rose-400/12",
                checked && "cursor-default",
              )}
            >
              <input
                id={`${id}-${i}`}
                type="radio"
                name={id}
                className="size-4 accent-violet-500"
                checked={isSelected}
                disabled={checked}
                onChange={() => setSelected(i)}
              />
              <span className="flex-1">{option}</span>
              {showRight && <CheckCircle2 className="size-5 text-lime-300" />}
              {showWrong && <XCircle className="size-5 text-rose-300" />}
            </label>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!checked ? (
          <Button
            variant="gradient"
            size="lg"
            className="px-5"
            disabled={selected === null}
            onClick={() => {
              setChecked(true);
              attempts.current += 1;
              // XP only for getting it right on the first try.
              if (activityId && attempts.current === 1 && selected === answer) {
                void award.recordActivity(pathname, activityId);
              }
            }}
          >
            {t("check")}
          </Button>
        ) : (
          <Button
            variant="glass"
            size="lg"
            className="px-5"
            onClick={() => {
              setChecked(false);
              setSelected(null);
            }}
          >
            <RotateCcw /> {t("tryAgain")}
          </Button>
        )}
        <p aria-live="polite" className="text-sm font-medium">
          {checked &&
            (correct ? (
              <span className="text-lime-300">{t("correct")}</span>
            ) : (
              <span className="text-rose-300">{t("wrong")}</span>
            ))}
        </p>
      </div>

      {checked && explanation && (
        <p className="mt-3 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/75">
          {explanation}
        </p>
      )}
    </fieldset>
  );
}
