"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Loader2,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";

import { submitReviewAnswer } from "@/app/actions/learning";
import { LanguageMonogram } from "@/components/languages/language-card";
import { celebrate } from "@/components/progress/use-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Link, useRouter } from "@/i18n/navigation";
import { languages } from "@/lib/languages";
import type { ReviewQuestion } from "@/lib/learning";

type Graded = { correct: boolean; answer: number };

/** One sitting of daily review: question, check, feedback, next. */
export function ReviewSession({
  questions,
  waiting,
  dueTomorrow,
  submit = submitReviewAnswer,
}: {
  questions: ReviewQuestion[];
  /** Everything waiting today, beyond this sitting too */
  waiting: number;
  dueTomorrow: number;
  /** Swappable for the design page's demo */
  submit?: typeof submitReviewAnswer;
}) {
  const t = useTranslations("review");
  const tProgress = useTranslations("progress");
  const tAchievements = useTranslations("achievements");
  const router = useRouter();
  const [index, setIndex] = React.useState(0);
  const [selected, setSelected] = React.useState<number | null>(null);
  const [graded, setGraded] = React.useState<Graded | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const [xp, setXp] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const id = React.useId();

  const question = questions[index];
  const last = index === questions.length - 1;

  const check = async () => {
    if (selected === null || saving) return;
    setSaving(true);
    try {
      const result = await submit(question.ref, selected);
      if (!result.ok) {
        toast.error(
          result.reason === "signed-out" ? t("signedOut") : t("failed"),
        );
        return;
      }
      setGraded({ correct: result.correct, answer: result.answer });
      if (result.correct) setScore((n) => n + 1);
      if (result.xpAwarded) {
        setXp(result.xpAwarded);
        celebrate(result, t("eyebrow"), tProgress, tAchievements);
      }
    } catch {
      toast.error(t("failed"));
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (last) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setGraded(null);
  };

  if (done) {
    const more = waiting - questions.length;
    return (
      <GlassCard
        variant="strong"
        glow="lime"
        className="flex flex-col items-center gap-4 text-center"
      >
        <h2 className="text-2xl font-bold text-white">{t("summary.title")}</h2>
        <p className="text-lg text-white/85">
          {t("summary.score", { correct: score, total: questions.length })}
        </p>
        {xp > 0 && (
          <p className="flex items-center gap-2 font-semibold text-amber-300">
            <Sparkles className="size-5" /> {t("summary.xp", { xp })}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          {more > 0
            ? t("summary.more", { count: more })
            : t("summary.tomorrow", { count: dueTomorrow })}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {more > 0 && (
            <Button
              variant="gradient"
              size="lg"
              className="px-5"
              onClick={() => router.refresh()}
            >
              <RotateCcw /> {t("summary.keepGoing")}
            </Button>
          )}
          <Button asChild variant="glass" size="lg" className="px-5">
            <Link href="/dashboard">{t("summary.dashboard")}</Link>
          </Button>
        </div>
      </GlassCard>
    );
  }

  const language = languages.find((l) => l.slug === question.language);

  return (
    <div className="flex flex-col gap-5">
      <ProgressBar
        value={index + (graded ? 1 : 0)}
        max={questions.length}
        tone="violet"
        label={t("progress", { current: index + 1, total: questions.length })}
      />
      <fieldset
        key={question.ref}
        className="rounded-2xl p-5 glass sm:p-6"
        aria-describedby={`${id}-source`}
      >
        <legend className="sr-only">
          {t("progress", { current: index + 1, total: questions.length })}
        </legend>
        <div
          id={`${id}-source`}
          className="mb-4 flex flex-wrap items-center gap-2 text-sm text-white/60"
        >
          {language && (
            <LanguageMonogram
              language={language}
              className="size-7 rounded-lg text-[0.65rem]"
            />
          )}
          <Link
            href={question.lessonHref}
            className="flex min-w-0 items-center gap-1.5 hover:text-white"
          >
            <BookOpen className="size-3.5 shrink-0" />
            <span className="truncate">
              {t("fromLesson", { title: question.lessonTitle })}
            </span>
          </Link>
          {question.isNew && <Badge tone="cyan">{t("new")}</Badge>}
        </div>
        <p className="flex items-start gap-2 text-lg font-semibold text-white">
          <HelpCircle className="mt-1 size-5 shrink-0 text-cyan-300" />
          {question.question}
        </p>

        <div className="mt-5 flex flex-col gap-2">
          {question.options.map((option, i) => {
            const isSelected = selected === i;
            const showRight = graded && i === graded.answer;
            const showWrong = graded && isSelected && i !== graded.answer;
            return (
              <label
                key={i}
                htmlFor={`${id}-${i}`}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm text-white/85 transition",
                  "border-white/10 bg-white/4 hover:border-white/25 hover:bg-white/8",
                  isSelected &&
                    !graded &&
                    "border-neon-violet/60 bg-neon-violet/12",
                  showRight && "border-neon-lime/60 bg-neon-lime/12",
                  showWrong && "border-rose-400/60 bg-rose-400/12",
                  graded && "cursor-default",
                )}
              >
                <input
                  id={`${id}-${i}`}
                  type="radio"
                  name={id}
                  className="size-4 accent-violet-500"
                  checked={isSelected}
                  disabled={Boolean(graded) || saving}
                  onChange={() => setSelected(i)}
                />
                <span className="flex-1">{option}</span>
                {showRight && <CheckCircle2 className="size-5 text-lime-300" />}
                {showWrong && <XCircle className="size-5 text-rose-300" />}
              </label>
            );
          })}
        </div>

        <p aria-live="polite" className="mt-4 text-sm font-medium">
          {graded &&
            (graded.correct ? (
              <span className="text-lime-300">{t("right")}</span>
            ) : (
              <span className="text-rose-300">
                {t("wrong", { answer: question.options[graded.answer] })}
              </span>
            ))}
        </p>
        {graded && question.explanation && (
          <p className="mt-3 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/75">
            {question.explanation}
          </p>
        )}

        <div className="mt-5">
          {!graded ? (
            <Button
              variant="gradient"
              size="lg"
              className="px-5"
              disabled={selected === null || saving}
              onClick={check}
            >
              {saving && <Loader2 className="animate-spin" />} {t("check")}
            </Button>
          ) : (
            <Button
              variant="gradient"
              size="lg"
              className="px-5"
              onClick={next}
              autoFocus
            >
              {last ? t("finish") : t("next")} <ArrowRight />
            </Button>
          )}
        </div>
      </fieldset>
    </div>
  );
}
