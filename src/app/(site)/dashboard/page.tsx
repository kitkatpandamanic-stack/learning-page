import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Flame,
  PartyPopper,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { cn } from "cn";

import { ActivityChart } from "@/components/landing/activity-chart";
import { UserAvatar } from "@/components/layout/user-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatCard } from "@/components/ui/stat-card";
import { getDashboard, getTimeZone } from "@/lib/progress";
import { requireSession } from "@/lib/session";
import { toneClasses, TONES } from "@/lib/tones";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

function timeAgo(date: Date) {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (seconds < 60) return "just now";
  if (seconds < 3600) return rtf.format(-Math.round(seconds / 60), "minute");
  if (seconds < 86400) return rtf.format(-Math.round(seconds / 3600), "hour");
  return rtf.format(-Math.round(seconds / 86400), "day");
}

export default async function DashboardPage() {
  const { user } = await requireSession("/dashboard");
  const d = await getDashboard(user.id, await getTimeZone());
  const firstName = user.name.split(" ")[0] || user.name;
  const unlockedCount = d.achievements.filter((a) => a.unlockedAt).length;
  const goalReached = d.todayXp >= d.dailyGoal;

  return (
    <Container className="flex flex-col gap-8 py-10 sm:py-14">
      {/* Header with learner level */}
      <GlassCard
        variant="strong"
        className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between"
      >
        <div className="flex items-center gap-4">
          <UserAvatar
            user={user}
            className="size-16 text-xl ring-2 ring-neon-violet/50"
          />
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              Welcome back, <GradientText>{firstName}</GradientText> 👋
            </h1>
            <p className="text-muted-foreground">
              {d.streak.activeToday
                ? "You've learned today. Nice work!"
                : d.streak.current > 0
                  ? `Learn today to keep your ${d.streak.current}-day streak alive!`
                  : "Ready to write some code today?"}
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-80">
          <div className="flex items-center justify-between">
            <Badge tone="violet" dot>
              Level {d.level.level}
            </Badge>
            <span className="text-xs text-white/55">
              {d.level.toNext} XP to level {d.level.level + 1}
            </span>
          </div>
          <ProgressBar
            value={d.level.current}
            max={d.level.span}
            tone="violet"
            size="lg"
            aria-label="Progress to next level"
          />
        </div>
      </GlassCard>

      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total XP"
          value={d.stats.totalXp.toLocaleString("en")}
          delta={`+${d.week.reduce((n, w) => n + w.xp, 0)} this week`}
          icon={<Sparkles />}
          tone="violet"
        />
        <StatCard
          label="Lessons done"
          value={d.stats.lessonsCompleted}
          delta={`${d.stats.exercisesSolved} ${d.stats.exercisesSolved === 1 ? "exercise" : "exercises"} solved`}
          icon={<BookOpen />}
          tone="cyan"
        />
        <StatCard
          label="Day streak"
          value={`${d.streak.current}${d.streak.current > 0 ? " 🔥" : ""}`}
          delta={`Best: ${d.streak.longest} ${d.streak.longest === 1 ? "day" : "days"}`}
          icon={<Flame />}
          tone="pink"
        />
        <StatCard
          label="Achievements"
          value={`${unlockedCount} / ${d.achievements.length}`}
          delta={unlockedCount ? "Keep collecting!" : "Unlock your first"}
          icon={<Trophy />}
          tone="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-6">
          {/* Continue learning */}
          {d.continueWith ? (
            <GlassCard
              glow="violet"
              className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm text-violet-300">
                  {d.stats.lessonsCompleted
                    ? "Continue learning"
                    : "Start here"}
                </p>
                <p className="text-xl font-bold text-white">
                  {d.continueWith.title}
                </p>
              </div>
              <Button asChild variant="gradient" size="xl" className="shrink-0">
                <Link href={d.continueWith.href}>
                  {d.stats.lessonsCompleted ? "Continue" : "Start"}{" "}
                  <ArrowRight />
                </Link>
              </Button>
            </GlassCard>
          ) : (
            <GlassCard glow="lime" className="flex items-center gap-3">
              <PartyPopper className="size-6 text-lime-300" />
              <p className="text-white">
                You&apos;ve finished every lesson available right now. More are
                on the way!
              </p>
            </GlassCard>
          )}

          {/* Weekly activity */}
          <GlassCard className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-white">Learning activity</h2>
              <span className="rounded-md bg-white/6 px-2 py-0.5 text-xs text-white/60">
                Last 7 days
              </span>
            </div>
            <div className="h-56">
              <ActivityChart data={d.week} />
            </div>
          </GlassCard>
        </div>

        <div className="flex flex-col gap-6">
          {/* Daily goal */}
          <GlassCard className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 font-semibold text-white">
              <Target className="size-5 text-pink-300" /> Daily goal
            </h2>
            <ProgressBar
              value={Math.min(d.todayXp, d.dailyGoal)}
              max={d.dailyGoal}
              tone={goalReached ? "lime" : "pink"}
              size="lg"
              label={`${d.todayXp} / ${d.dailyGoal} XP today`}
            />
            <p className="text-sm text-muted-foreground">
              {goalReached
                ? "Goal reached! 🎉 Anything more is a bonus."
                : `${d.dailyGoal - d.todayXp} XP to go. A lesson plus its exercise usually does it.`}
            </p>
          </GlassCard>

          {/* Courses */}
          <GlassCard className="flex flex-col gap-4">
            <h2 className="font-semibold text-white">Your courses</h2>
            {d.courses.map((c, i) => (
              <ProgressBar
                key={c.slug}
                label={
                  <Link
                    href={`/languages/${c.slug}`}
                    className="hover:text-white"
                  >
                    {c.name}{" "}
                    <span className="text-white/45">
                      · {c.completed}/{c.total}
                    </span>
                  </Link>
                }
                value={c.completed}
                max={c.total}
                tone={TONES[(i + 1) % TONES.length]}
                showValue
              />
            ))}
            <Link
              href="/languages"
              className="text-sm text-cyan-300 hover:underline"
            >
              Browse all languages →
            </Link>
          </GlassCard>
        </div>
      </div>

      {/* Achievements */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-white">Achievements</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {d.achievements.map((a) => {
            const t = toneClasses[a.tone];
            const unlocked = Boolean(a.unlockedAt);
            return (
              <li key={a.id}>
                <GlassCard
                  padding="sm"
                  glow={unlocked ? a.tone : "none"}
                  className={cn(
                    "flex h-full items-start gap-3",
                    !unlocked && "opacity-55",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-xl text-2xl",
                      unlocked ? t.soft : "bg-white/5 grayscale",
                    )}
                  >
                    {a.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.description}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-xs",
                        unlocked ? t.text : "text-white/40",
                      )}
                    >
                      {unlocked
                        ? `Unlocked ${timeAgo(a.unlockedAt!)}`
                        : "Locked"}
                    </p>
                  </div>
                </GlassCard>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Recent activity */}
      {d.recent.length > 0 && (
        <GlassCard className="flex flex-col gap-3">
          <h2 className="font-semibold text-white">Recent activity</h2>
          <ul className="flex flex-col divide-y divide-white/8">
            {d.recent.map((e, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 py-2.5 text-sm"
              >
                <span className="text-white/80">{e.label}</span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-white/40">{timeAgo(e.at)}</span>
                  <span className="font-mono font-semibold text-amber-300">
                    +{e.amount} XP
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}
    </Container>
  );
}
