"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  LogIn,
  Sparkles,
} from "lucide-react";

import { useAward, useProgress } from "@/components/progress/use-progress";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Link } from "@/i18n/navigation";

/** End-of-lesson card: complete the lesson for XP, then move on. */
export function CompleteLesson({
  language,
  slug,
  permalink,
  xp,
  next,
}: {
  language: string;
  slug: string;
  permalink: string;
  xp: number;
  next?: { title: string; href: string };
}) {
  const t = useTranslations("progress");
  const tCommon = useTranslations("common");
  const { data, isPending } = useProgress(language);
  const award = useAward(language);
  const [saving, setSaving] = React.useState(false);

  if (isPending) {
    return <div className="h-24 animate-pulse rounded-2xl bg-white/5" />;
  }

  if (!data?.signedIn) {
    return (
      <GlassCard className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-white">{t("finished")}</p>
          <p className="text-sm text-muted-foreground">
            {t("signInToSave", { xp })}
          </p>
        </div>
        <Button asChild variant="glass" size="lg" className="shrink-0 px-5">
          <Link href={{ pathname: "/sign-in", query: { next: permalink } }}>
            <LogIn /> {tCommon("signIn")}
          </Link>
        </Button>
      </GlassCard>
    );
  }

  const done = data.completed.includes(slug);

  if (done) {
    return (
      <GlassCard
        glow="lime"
        className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="flex items-center gap-2 font-semibold text-lime-200">
          <CheckCircle2 className="size-5" /> {t("done")}
        </p>
        {next && (
          <Button
            asChild
            variant="gradient"
            size="lg"
            className="shrink-0 px-5"
          >
            <Link href={next.href}>
              {t("next", { title: next.title })} <ArrowRight />
            </Link>
          </Button>
        )}
      </GlassCard>
    );
  }

  return (
    <GlassCard
      glow="violet"
      className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="font-semibold text-white">{t("finished")}</p>
        <p className="text-sm text-muted-foreground">{t("markComplete")}</p>
      </div>
      <Button
        variant="gradient"
        size="xl"
        className="shrink-0"
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          await award.completeLesson(slug);
          setSaving(false);
        }}
      >
        {saving ? <Loader2 className="animate-spin" /> : <Sparkles />}
        {t("completeButton", { xp })}
      </Button>
    </GlassCard>
  );
}
