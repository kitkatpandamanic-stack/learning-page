import type { ReactNode } from "react";
import type { Metadata } from "next";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Code2,
  Flame,
  Play,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";

import { LogoMark } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Container } from "@/components/ui/container";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatCard } from "@/components/ui/stat-card";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false },
};

const neon = [
  { name: "Violet", className: "bg-neon-violet", hex: "#8B5CF6" },
  { name: "Cyan", className: "bg-neon-cyan", hex: "#22D3EE" },
  { name: "Pink", className: "bg-neon-pink", hex: "#F472B6" },
  { name: "Lime", className: "bg-neon-lime", hex: "#A3E635" },
  { name: "Amber", className: "bg-neon-amber", hex: "#FBBF24" },
];

const languages = [
  { name: "JavaScript", className: "bg-lang-javascript" },
  { name: "TypeScript", className: "bg-lang-typescript" },
  { name: "Python", className: "bg-lang-python" },
  { name: "Java", className: "bg-lang-java" },
  { name: "C#", className: "bg-lang-csharp" },
  { name: "Go", className: "bg-lang-go" },
  { name: "Rust", className: "bg-lang-rust" },
  { name: "C++", className: "bg-lang-cpp" },
  { name: "SQL", className: "bg-lang-sql" },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="font-mono text-sm tracking-wider text-cyan-300 uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DesignPage() {
  return (
    <Container className="flex flex-col gap-16 py-16">
      <SectionHeading
        as="h1"
        eyebrow="Phase 1"
        title={
          <>
            PandaDev <GradientText>design system</GradientText>
          </>
        }
        description="Colours, glass surfaces and building blocks used across the whole site."
      />

      <Section title="Brand colours">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {neon.map((c) => (
            <GlassCard
              key={c.name}
              padding="sm"
              className="flex flex-col gap-3"
            >
              <div className={`h-16 rounded-xl ${c.className}`} />
              <div>
                <p className="font-semibold text-white">{c.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {c.hex}
                </p>
              </div>
            </GlassCard>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {languages.map((l) => (
            <span
              key={l.name}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-white glass"
            >
              <span className={`size-2.5 rounded-full ${l.className}`} />
              {l.name}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <GlassCard className="flex flex-col gap-4">
          <p className="text-5xl font-bold tracking-tight text-white">
            Learn to code. <GradientText>Zero to Senior.</GradientText>
          </p>
          <p className="text-2xl font-semibold text-white">
            Heading: <GradientText variant="cool">cool gradient</GradientText>
          </p>
          <p className="max-w-2xl text-muted-foreground">
            Body text uses Plus Jakarta Sans. It stays readable on glass thanks
            to the soft lavender-white foreground colour.
          </p>
          <pre className="rounded-xl bg-black/40 p-4 font-mono text-sm text-cyan-200">
            {`const panda = "dev";\nconsole.log(\`Hello, \${panda}!\`);`}
          </pre>
        </GlassCard>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="gradient" size="xl">
            Start learning <ArrowRight />
          </Button>
          <Button variant="glass" size="xl">
            <Play /> Watch demo
          </Button>
          <Button variant="gradient" size="lg" className="px-5">
            Gradient
          </Button>
          <Button variant="glass" size="lg" className="px-5">
            Glass
          </Button>
          <Button>Primary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge tone="violet" dot>
            Beginner
          </Badge>
          <Badge tone="cyan" dot>
            Junior
          </Badge>
          <Badge tone="pink" dot>
            Middle
          </Badge>
          <Badge tone="amber" dot>
            Senior
          </Badge>
          <Badge tone="lime">Completed</Badge>
          <Badge tone="neutral">12 lessons</Badge>
        </div>
      </Section>

      <Section title="Floating chips">
        <div className="flex flex-wrap gap-4">
          <Chip
            icon={<CheckCircle2 />}
            tone="lime"
            label="Lesson 12 completed"
            sublabel="Python · Loops"
            className="motion-safe:animate-float"
          />
          <Chip
            icon={<Zap />}
            tone="amber"
            label="+50 XP"
            sublabel="Daily goal reached"
            className="[animation-delay:-2s] motion-safe:animate-float"
          />
          <Chip
            icon={<Flame />}
            tone="pink"
            label="7-day streak"
            sublabel="Keep it up!"
            className="[animation-delay:-4s] motion-safe:animate-float"
          />
          <Chip
            icon={<Code2 />}
            tone="cyan"
            label="JavaScript"
            sublabel="Level 0 · Beginner"
          />
        </div>
      </Section>

      <Section title="Stat cards">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
            value="14"
            delta="Personal best!"
            icon={<Flame />}
            tone="pink"
          />
          <StatCard
            label="Hours coded"
            value="42h"
            delta="+5h this week"
            icon={<Clock />}
            tone="lime"
          />
        </div>
      </Section>

      <Section title="Progress bars">
        <GlassCard className="flex flex-col gap-5">
          <ProgressBar label="JavaScript" value={72} tone="amber" showValue />
          <ProgressBar label="Python" value={48} tone="cyan" showValue />
          <ProgressBar label="TypeScript" value={30} tone="violet" showValue />
          <ProgressBar
            label="Rust"
            value={12}
            tone="pink"
            showValue
            size="sm"
          />
        </GlassCard>
      </Section>

      <Section title="Glass cards">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <GlassCard interactive className="flex flex-col gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-neon-violet/15 text-violet-300">
              <Code2 />
            </span>
            <h3 className="text-lg font-semibold text-white">Interactive</h3>
            <p className="text-sm text-muted-foreground">
              Hover me: I lift up and glow.
            </p>
          </GlassCard>
          <GlassCard glow="cyan" className="flex flex-col gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-neon-cyan/15 text-cyan-300">
              <Trophy />
            </span>
            <h3 className="text-lg font-semibold text-white">Cyan glow</h3>
            <p className="text-sm text-muted-foreground">
              Use for highlighted or featured content.
            </p>
          </GlassCard>
          <GlassCard variant="strong" className="flex flex-col gap-3">
            <LogoMark className="size-11" />
            <h3 className="text-lg font-semibold text-white">Strong glass</h3>
            <p className="text-sm text-muted-foreground">
              More opaque, for text over busy backgrounds.
            </p>
          </GlassCard>
        </div>
      </Section>
    </Container>
  );
}
