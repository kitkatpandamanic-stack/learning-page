import {
  Bell,
  BookOpen,
  Clock,
  Code2,
  Flame,
  LayoutDashboard,
  Map as MapIcon,
  Settings,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { cn } from "cn";

import { LogoMark } from "@/components/brand/logo";
import {
  ActivityChart,
  type ActivityPoint,
} from "@/components/landing/activity-chart";
import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatCard } from "@/components/ui/stat-card";
import type { Tone } from "@/lib/tones";

// Sample data: this section previews what a learner's dashboard looks like.
// XP for Monday to Sunday; the weekday labels are formatted in the visitor's
// language from a week that starts on Monday 1 January 2024.
const weeklyXp = [120, 210, 160, 320, 280, 450, 390];

const progress: { name: string; value: number; tone: Tone }[] = [
  { name: "JavaScript", value: 72, tone: "amber" },
  { name: "Python", value: 48, tone: "cyan" },
  { name: "TypeScript", value: 31, tone: "violet" },
  { name: "SQL", value: 15, tone: "pink" },
];

const nav = [
  { id: "overview", icon: LayoutDashboard, active: true },
  { id: "myLanguages", icon: Code2 },
  { id: "lessons", icon: BookOpen },
  { id: "roadmap", icon: MapIcon },
  { id: "achievements", icon: Trophy },
  { id: "settings", icon: Settings },
] as const;

export function DashboardPreview() {
  const t = useTranslations("home.dashboard");
  const format = useFormatter();
  const activity: ActivityPoint[] = weeklyXp.map((xp, i) => ({
    day: format.dateTime(Date.UTC(2024, 0, 1 + i), {
      weekday: "short",
      timeZone: "UTC",
    }),
    xp,
  }));
  const thisWeek = (value: string) => t("stats.thisWeek", { value });
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={t("eyebrow")}
            eyebrowTone="cyan"
            title={t.rich("title", {
              gradient: (chunks) => <GradientText>{chunks}</GradientText>,
            })}
            description={t("description")}
          />
        </Reveal>

        <Reveal delay={0.1} className="relative mt-14">
          {/* Glow under the window */}
          <div
            aria-hidden
            className="absolute inset-x-[10%] -bottom-10 h-40 rounded-full bg-neon-violet/30 blur-[90px]"
          />

          <GlassCard
            padding="none"
            variant="strong"
            className="relative overflow-hidden"
            aria-label={t("ariaLabel")}
            role="img"
          >
            <div className="grid lg:grid-cols-[220px_1fr]">
              {/* Sidebar */}
              <aside className="hidden flex-col gap-1 border-r border-white/8 p-4 lg:flex">
                <div className="mb-5 flex items-center gap-2 px-2">
                  <LogoMark className="size-7" />
                  <span className="font-bold text-white">
                    Panda<span className="text-gradient">Dev</span>
                  </span>
                </div>
                {nav.map(({ id, icon: Icon, ...item }) => (
                  <span
                    key={id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
                      "active" in item
                        ? "bg-gradient-to-r from-neon-violet/30 to-neon-violet/5 text-white ring-1 ring-neon-violet/40"
                        : "text-white/60",
                    )}
                  >
                    <Icon className="size-4" />
                    {t(`nav.${id}`)}
                  </span>
                ))}
                <div className="mt-auto rounded-xl bg-gradient-to-br from-neon-violet/25 to-neon-pink/15 p-3 ring-1 ring-white/10">
                  <p className="text-sm font-semibold text-white">
                    {t("dailyGoal")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("dailyGoalProgress", { done: 40, goal: 50 })}
                  </p>
                  <ProgressBar
                    value={80}
                    tone="pink"
                    size="sm"
                    className="mt-2"
                  />
                </div>
              </aside>

              {/* Main */}
              <div className="flex flex-col gap-5 p-4 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold text-white sm:text-xl">
                      {t("greeting", { name: t("sampleName") })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("lessonsAway", { count: 2, level: 1 })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden size-9 items-center justify-center rounded-full bg-white/6 text-white/70 sm:flex">
                      <Bell className="size-4" />
                    </span>
                    <span className="flex size-9 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-white">
                      {t("sampleInitial")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  <StatCard
                    label={t("stats.totalXp")}
                    value={format.number(12480)}
                    delta={thisWeek(format.number(320))}
                    icon={<Sparkles />}
                    tone="violet"
                  />
                  <StatCard
                    label={t("stats.lessonsDone")}
                    value={format.number(86)}
                    delta={thisWeek(format.number(9))}
                    icon={<BookOpen />}
                    tone="cyan"
                  />
                  <StatCard
                    label={t("stats.dayStreak")}
                    value={`${format.number(14)} 🔥`}
                    delta={t("stats.personalBest")}
                    icon={<Flame />}
                    tone="pink"
                  />
                  <StatCard
                    label={t("stats.timeCoding")}
                    value={t("stats.hours", { count: 42 })}
                    delta={thisWeek(t("stats.hours", { count: 5 }))}
                    icon={<Clock />}
                    tone="lime"
                  />
                </div>

                <div className="grid gap-3 xl:grid-cols-[1.6fr_1fr]">
                  <GlassCard padding="sm">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">
                        {t("activity")}
                      </p>
                      <span className="rounded-md bg-white/6 px-2 py-0.5 text-xs text-white/60">
                        {t("thisWeek")}
                      </span>
                    </div>
                    <div className="h-52">
                      <ActivityChart data={activity} />
                    </div>
                  </GlassCard>

                  <GlassCard padding="sm" className="flex flex-col gap-4">
                    <p className="text-sm font-semibold text-white">
                      {t("yourLanguages")}
                    </p>
                    {progress.map((p) => (
                      <ProgressBar
                        key={p.name}
                        label={p.name}
                        value={p.value}
                        tone={p.tone}
                        showValue
                        size="sm"
                      />
                    ))}
                  </GlassCard>
                </div>
              </div>
            </div>
          </GlassCard>
        </Reveal>
      </Container>
    </section>
  );
}
