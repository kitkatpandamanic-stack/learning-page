"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { cn } from "cn";

import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { SectionHeading } from "@/components/ui/section-heading";
import { levels } from "@/lib/levels";
import { toneClasses } from "@/lib/tones";

export function RoadmapSection() {
  const t = useTranslations("home.roadmap");
  const tLevels = useTranslations("levels");
  return (
    <section id="roadmap" className="scroll-mt-28 py-16 sm:py-20">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={t("eyebrow")}
            eyebrowTone="pink"
            title={t.rich("title", {
              gradient: (chunks) => <GradientText>{chunks}</GradientText>,
              cool: (chunks) => (
                <GradientText variant="cool">{chunks}</GradientText>
              ),
            })}
            description={t("description")}
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
              const tone = toneClasses[item.tone];
              const topics = tLevels.raw(`${item.level}.topics`) as string[];
              const Icon = item.icon;
              return (
                <li key={item.level}>
                  <Reveal
                    delay={i * 0.15}
                    className="flex gap-5 lg:flex-col lg:items-center lg:gap-6"
                  >
                    <span
                      className={cn(
                        "relative z-10 flex size-14 shrink-0 items-center justify-center rounded-2xl border bg-space-900 [&_svg]:size-6",
                        tone.border,
                        tone.text,
                        tone.glow,
                      )}
                    >
                      <Icon />
                    </span>
                    <GlassCard interactive className="flex-1 lg:w-full">
                      <p
                        className={cn(
                          "font-mono text-xs tracking-wider uppercase",
                          tone.text,
                        )}
                      >
                        {tLevels("level", { level: item.level })}
                      </p>
                      <h3 className="mt-1 text-xl font-bold text-white">
                        {tLevels(`${item.level}.name`)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {tLevels(`${item.level}.tagline`)}
                      </p>
                      <ul className="mt-4 flex flex-col gap-2">
                        {topics.map((topic) => (
                          <li
                            key={topic}
                            className="flex items-center gap-2 text-sm text-white/80"
                          >
                            <span
                              className={cn("size-1.5 rounded-full", tone.fill)}
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
