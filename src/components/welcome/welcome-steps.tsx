"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";

import { finishWelcome } from "@/app/actions/learning";
import { LanguageMonogram } from "@/components/languages/language-card";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Link, useRouter } from "@/i18n/navigation";
import type { Language } from "@/lib/languages";
import { DAILY_GOALS, START_LEVELS } from "@/lib/welcome";

export type WelcomeLanguage = {
  language: Language;
  lessons: number;
  /** First lesson title of each starting level (0–2) */
  starts: (string | null)[];
};

type Choice = { language?: string; level?: number; dailyGoal?: number };

/** One option as a big tappable card that behaves like a radio button. */
function OptionCard({
  selected,
  onSelect,
  children,
  name,
}: {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
  name: string;
}) {
  return (
    <label
      className={cn(
        "relative flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition",
        "border-white/10 bg-white/4 hover:border-white/25 hover:bg-white/8",
        "has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
        selected && "border-neon-violet/60 bg-neon-violet/12",
      )}
    >
      <input
        type="radio"
        name={name}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      {children}
      <span
        aria-hidden
        className={cn(
          "ml-auto flex size-6 shrink-0 items-center justify-center rounded-full ring-1",
          selected
            ? "bg-neon-violet text-white ring-neon-violet"
            : "ring-white/25",
        )}
      >
        {selected && <Check className="size-4" />}
      </span>
    </label>
  );
}

/** Language, starting level and daily goal, one question at a time. */
export function WelcomeSteps({
  languages,
  initial,
  next,
  skipHref,
  save = finishWelcome,
}: {
  languages: WelcomeLanguage[];
  initial: Choice;
  /** Where the learner was going when they signed in */
  next: string;
  skipHref: string;
  /** Swappable for the design page's demo */
  save?: typeof finishWelcome;
}) {
  const t = useTranslations("welcome");
  const tLevels = useTranslations("levels");
  const tInfo = useTranslations("languageInfo");
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [choice, setChoice] = React.useState<Choice>(initial);
  const [saving, setSaving] = React.useState(false);
  const heading = React.useRef<HTMLHeadingElement>(null);

  const steps = ["language", "level", "goal"] as const;
  const current = steps[step];
  const picked = languages.find((l) => l.language.slug === choice.language);
  const answered =
    current === "language"
      ? choice.language !== undefined
      : current === "level"
        ? choice.level !== undefined
        : choice.dailyGoal !== undefined;

  // Move focus to the new question so screen readers announce it (not on page load).
  const moved = React.useRef(false);
  React.useEffect(() => {
    if (moved.current) heading.current?.focus();
    moved.current = true;
  }, [step]);

  const finish = async () => {
    if (!choice.language || choice.level === undefined || !choice.dailyGoal)
      return;
    setSaving(true);
    try {
      const result = await save(
        {
          language: choice.language,
          level: choice.level,
          dailyGoal: choice.dailyGoal,
        },
        next,
        locale,
      );
      if (!result.ok) throw new Error(result.reason);
      router.push(result.href);
    } catch {
      toast.error(t("failed"));
      setSaving(false);
    }
  };

  return (
    <GlassCard variant="strong" padding="lg" className="flex flex-col gap-6">
      <ProgressBar
        value={step + 1}
        max={steps.length}
        tone="violet"
        label={t("step", { current: step + 1, total: steps.length })}
      />

      <div>
        <h2
          ref={heading}
          tabIndex={-1}
          className="text-2xl font-bold text-white outline-none"
        >
          {t(`${current}.title`)}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(`${current}.hint`)}
        </p>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">{t(`${current}.title`)}</legend>
        {current === "language" &&
          languages.map(({ language, lessons }) => (
            <OptionCard
              key={language.slug}
              name="language"
              selected={choice.language === language.slug}
              onSelect={() => setChoice({ ...choice, language: language.slug })}
            >
              <LanguageMonogram language={language} className="size-12" />
              <span className="min-w-0">
                <span className="block font-semibold text-white">
                  {language.name}
                </span>
                <span className="block text-sm text-white/60">
                  {tInfo(`${language.slug as "python"}.description`)}
                </span>
                <span className="block text-xs text-white/40">
                  {t("language.lessons", { count: lessons })}
                </span>
              </span>
            </OptionCard>
          ))}

        {current === "level" &&
          START_LEVELS.map((level) => {
            const start = picked?.starts[level];
            return (
              <OptionCard
                key={level}
                name="level"
                selected={choice.level === level}
                onSelect={() => setChoice({ ...choice, level })}
              >
                <span className="min-w-0">
                  <span className="block font-semibold text-white">
                    {t(`level.options.${level}.title`)}
                  </span>
                  <span className="block text-sm text-white/60">
                    {t(`level.options.${level}.body`)}
                  </span>
                  <span className="mt-1 block text-xs text-violet-300">
                    {tLevels("level", { level })} · {tLevels(`${level}.name`)}
                    {start
                      ? ` · ${t("level.startsWith", { title: start })}`
                      : ""}
                  </span>
                </span>
              </OptionCard>
            );
          })}

        {current === "goal" &&
          DAILY_GOALS.map((goal) => (
            <OptionCard
              key={goal.id}
              name="goal"
              selected={choice.dailyGoal === goal.xp}
              onSelect={() => setChoice({ ...choice, dailyGoal: goal.xp })}
            >
              <span className="min-w-0">
                <span className="block font-semibold text-white">
                  {t(`goal.options.${goal.id}`)}
                </span>
                <span className="block text-sm text-white/60">
                  {t("goal.minutes", { minutes: goal.minutes })}
                </span>
              </span>
              <span className="text-sm font-semibold text-amber-300">
                {t("goal.xp", { xp: goal.xp })}
              </span>
            </OptionCard>
          ))}
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {step > 0 ? (
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setStep(step - 1)}
            disabled={saving}
          >
            <ArrowLeft /> {t("back")}
          </Button>
        ) : (
          <Link
            href={skipHref}
            className="text-sm text-white/55 hover:text-white hover:underline"
          >
            {t("skip")}
          </Link>
        )}
        {step < steps.length - 1 ? (
          <Button
            variant="gradient"
            size="lg"
            className="px-6"
            disabled={!answered}
            onClick={() => setStep(step + 1)}
          >
            {t("next")} <ArrowRight />
          </Button>
        ) : (
          <Button
            variant="gradient"
            size="lg"
            className="px-6"
            disabled={!answered || saving}
            onClick={finish}
          >
            {saving && <Loader2 className="animate-spin" />} {t("finish")}{" "}
            {!saving && <ArrowRight />}
          </Button>
        )}
      </div>
    </GlassCard>
  );
}
