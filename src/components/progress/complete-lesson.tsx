"use client";

import * as React from "react";
import Link from "next/link";
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
          <p className="font-semibold text-white">Finished this lesson?</p>
          <p className="text-sm text-muted-foreground">
            Sign in to save your progress and earn {xp} XP.
          </p>
        </div>
        <Button asChild variant="glass" size="lg" className="shrink-0 px-5">
          <Link href={`/sign-in?next=${encodeURIComponent(permalink)}`}>
            <LogIn /> Sign in
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
          <CheckCircle2 className="size-5" /> Lesson complete
        </p>
        {next && (
          <Button
            asChild
            variant="gradient"
            size="lg"
            className="shrink-0 px-5"
          >
            <Link href={next.href}>
              Next: {next.title} <ArrowRight />
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
        <p className="font-semibold text-white">Finished this lesson?</p>
        <p className="text-sm text-muted-foreground">
          Mark it complete to save your progress.
        </p>
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
        Complete lesson · +{xp} XP
      </Button>
    </GlassCard>
  );
}
