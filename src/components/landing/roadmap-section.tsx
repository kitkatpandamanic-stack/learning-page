"use client";

import { motion } from "motion/react";
import { Crown, Rocket, Sprout, Wrench, type LucideIcon } from "lucide-react";
import { cn } from "cn";

import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { SectionHeading } from "@/components/ui/section-heading";
import { toneClasses, type Tone } from "@/lib/tones";

const levels: {
  level: number;
  name: string;
  tagline: string;
  icon: LucideIcon;
  tone: Tone;
  topics: string[];
}[] = [
  {
    level: 0,
    name: "Beginner",
    tagline: "Your first lines of code",
    icon: Sprout,
    tone: "lime",
    topics: [
      "Variables & types",
      "Conditions & loops",
      "Functions",
      "First mini-games",
    ],
  },
  {
    level: 1,
    name: "Junior",
    tagline: "Build real things",
    icon: Wrench,
    tone: "cyan",
    topics: [
      "Data structures",
      "OOP & modules",
      "Errors & debugging",
      "Git & tooling",
    ],
  },
  {
    level: 2,
    name: "Middle",
    tagline: "Work like a pro",
    icon: Rocket,
    tone: "violet",
    topics: ["Async & APIs", "Testing", "Design patterns", "Databases"],
  },
  {
    level: 3,
    name: "Senior",
    tagline: "Lead and architect",
    icon: Crown,
    tone: "amber",
    topics: [
      "System design",
      "Performance",
      "Security",
      "Code review & mentoring",
    ],
  },
];

export function RoadmapSection() {
  return (
    <section id="roadmap" className="scroll-mt-28 py-16 sm:py-20">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="The path"
            eyebrowTone="pink"
            title={
              <>
                From <GradientText>Zero</GradientText> to{" "}
                <GradientText variant="cool">Senior</GradientText>
              </>
            }
            description="Four levels for every language. Each one ends with a capstone project, so you finish with a portfolio, not just notes."
          />
        </Reveal>

        <div className="relative mt-16">
          {/* Glowing line connecting the levels (horizontal on desktop, vertical on mobile) */}
          <motion.div
            aria-hidden
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-7 right-[12.5%] left-[12.5%] hidden h-0.5 origin-left bg-gradient-to-r from-neon-lime via-neon-violet to-neon-amber shadow-glow-violet lg:block"
          />
          <motion.div
            aria-hidden
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-7 bottom-7 left-7 w-0.5 origin-top bg-gradient-to-b from-neon-lime via-neon-violet to-neon-amber lg:hidden"
          />

          <ol className="relative grid gap-8 lg:grid-cols-4 lg:gap-5">
            {levels.map((item, i) => {
              const t = toneClasses[item.tone];
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Reveal
                    delay={i * 0.15}
                    className="flex gap-5 lg:flex-col lg:items-center lg:gap-6"
                  >
                    <span
                      className={cn(
                        "relative z-10 flex size-14 shrink-0 items-center justify-center rounded-2xl border bg-space-900 [&_svg]:size-6",
                        t.border,
                        t.text,
                        t.glow,
                      )}
                    >
                      <Icon />
                    </span>
                    <GlassCard interactive className="flex-1 lg:w-full">
                      <p
                        className={cn(
                          "font-mono text-xs tracking-wider uppercase",
                          t.text,
                        )}
                      >
                        Level {item.level}
                      </p>
                      <h3 className="mt-1 text-xl font-bold text-white">
                        {item.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.tagline}
                      </p>
                      <ul className="mt-4 flex flex-col gap-2">
                        {item.topics.map((topic) => (
                          <li
                            key={topic}
                            className="flex items-center gap-2 text-sm text-white/80"
                          >
                            <span
                              className={cn("size-1.5 rounded-full", t.fill)}
                            />
                            {topic}
                          </li>
                        ))}
                      </ul>
                    </GlassCard>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>
      </Container>
    </section>
  );
}
