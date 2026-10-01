import {
  Briefcase,
  GraduationCap,
  Rocket,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "cn";

import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { SectionHeading } from "@/components/ui/section-heading";
import type { LevelNumber } from "@/lib/levels";

/**
 * Who PandaDev is for. When real learners share feedback, quotes (with their
 * permission) can go here; until then we only describe the paths.
 */
const audiences: {
  id: "beginners" | "students" | "developers";
  icon: LucideIcon;
  /** Level numbers to start from (names come from the "levels" messages). */
  start: [LevelNumber] | [LevelNumber, LevelNumber];
  tone: string;
}[] = [
  {
    id: "beginners",
    icon: Rocket,
    start: [0],
    tone: "from-neon-violet to-neon-pink",
  },
  {
    id: "students",
    icon: GraduationCap,
    start: [1],
    tone: "from-neon-cyan to-neon-violet",
  },
  {
    id: "developers",
    icon: Briefcase,
    start: [2, 3],
    tone: "from-neon-amber to-neon-pink",
  },
];

export function AudienceSection() {
  const t = useTranslations("home.audience");
  const tLevels = useTranslations("levels");
  const levelName = (level: LevelNumber) => tLevels(`${level}.name`);
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={t("eyebrow")}
            eyebrowTone="amber"
            title={t.rich("title", {
              gradient: (chunks) => <GradientText>{chunks}</GradientText>,
            })}
          />
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {audiences.map((a, i) => (
            <Reveal key={a.id} delay={i * 0.1} className="h-full">
              <GlassCard interactive className="flex h-full flex-col gap-4">
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-xl bg-gradient-to-br",
                    a.tone,
                  )}
                >
                  <a.icon className="size-5 text-white" />
                </span>
                <h3 className="text-lg font-semibold text-white">
                  {t(`${a.id}.title`)}
                </h3>
                <p className="text-white/80">{t(`${a.id}.text`)}</p>
                <p className="mt-auto text-sm font-medium text-white/60">
                  {a.start.length === 1
                    ? t("startOne", { level: levelName(a.start[0]) })
                    : t("startTwo", {
                        first: levelName(a.start[0]),
                        second: levelName(a.start[1]),
                      })}
                </p>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
