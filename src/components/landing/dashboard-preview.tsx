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
import { cn } from "cn";

import { LogoMark } from "@/components/brand/logo";
import { ActivityChart } from "@/components/landing/activity-chart";
import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatCard } from "@/components/ui/stat-card";
import type { Tone } from "@/lib/tones";

// Sample data: this section previews what a learner's dashboard looks like.
const activity = [
  { day: "Mon", xp: 120 },
  { day: "Tue", xp: 210 },
  { day: "Wed", xp: 160 },
  { day: "Thu", xp: 320 },
  { day: "Fri", xp: 280 },
  { day: "Sat", xp: 450 },
  { day: "Sun", xp: 390 },
];

const progress: { name: string; value: number; tone: Tone }[] = [
  { name: "JavaScript", value: 72, tone: "amber" },
  { name: "Python", value: 48, tone: "cyan" },
  { name: "TypeScript", value: 31, tone: "violet" },
  { name: "SQL", value: 15, tone: "pink" },
];

const nav = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "My languages", icon: Code2 },
  { label: "Lessons", icon: BookOpen },
  { label: "Roadmap", icon: MapIcon },
  { label: "Achievements", icon: Trophy },
  { label: "Settings", icon: Settings },
];

export function DashboardPreview() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Track your progress"
            eyebrowTone="cyan"
            title={
              <>
                See yourself <GradientText>level up</GradientText>
              </>
            }
            description="Earn XP for every lesson, keep your streak alive and watch each language fill up as you go."
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
            aria-label="Example learner dashboard"
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
                {nav.map(({ label, icon: Icon, active }) => (
                  <span
                    key={label}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
                      active
                        ? "bg-gradient-to-r from-neon-violet/30 to-neon-violet/5 text-white ring-1 ring-neon-violet/40"
                        : "text-white/60",
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </span>
                ))}
                <div className="mt-auto rounded-xl bg-gradient-to-br from-neon-violet/25 to-neon-pink/15 p-3 ring-1 ring-white/10">
                  <p className="text-sm font-semibold text-white">Daily goal</p>
                  <p className="text-xs text-muted-foreground">
                    40 / 50 XP today
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
                      Good morning, Alex 👋
                    </p>
                    <p className="text-sm text-muted-foreground">
                      You&apos;re 2 lessons away from finishing Level 1.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden size-9 items-center justify-center rounded-full bg-white/6 text-white/70 sm:flex">
                      <Bell className="size-4" />
                    </span>
                    <span className="flex size-9 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-white">
                      A
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  <StatCard
                    label="Total XP"
                    value="12,480"
                    delta="+320 this week"
                    icon={<Sparkles />}
                    tone="violet"
                  />
                  <StatCard
                    label="Lessons done"
                    value="86"
                    delta="+9 this week"
                    icon={<BookOpen />}
                    tone="cyan"
                  />
                  <StatCard
                    label="Day streak"
                    value="14 🔥"
                    delta="Personal best!"
                    icon={<Flame />}
                    tone="pink"
                  />
                  <StatCard
                    label="Time coding"
                    value="42h"
                    delta="+5h this week"
                    icon={<Clock />}
                    tone="lime"
                  />
                </div>

                <div className="grid gap-3 xl:grid-cols-[1.6fr_1fr]">
                  <GlassCard padding="sm">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">
                        Learning activity
                      </p>
                      <span className="rounded-md bg-white/6 px-2 py-0.5 text-xs text-white/60">
                        This week
                      </span>
                    </div>
                    <div className="h-52">
                      <ActivityChart data={activity} />
                    </div>
                  </GlassCard>

                  <GlassCard padding="sm" className="flex flex-col gap-4">
                    <p className="text-sm font-semibold text-white">
                      Your languages
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
