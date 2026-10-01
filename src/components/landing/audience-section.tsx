import {
  Briefcase,
  GraduationCap,
  Rocket,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";

import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { SectionHeading } from "@/components/ui/section-heading";

/**
 * Who PandaDev is for. When real learners share feedback, quotes (with their
 * permission) can go here; until then we only describe the paths.
 */
const audiences: {
  icon: LucideIcon;
  title: string;
  text: string;
  start: string;
  tone: string;
}[] = [
  {
    icon: Rocket,
    title: "Complete beginners",
    text: "Never written code? Start at Level 0 with your first line, and practise every idea in an editor right inside the lesson.",
    start: "Start with: Beginner",
    tone: "from-neon-violet to-neon-pink",
  },
  {
    icon: GraduationCap,
    title: "Students",
    text: "Go past the syntax with arrays, objects, the DOM, classes and errors, then type-safe code with TypeScript.",
    start: "Start with: Junior",
    tone: "from-neon-cyan to-neon-violet",
  },
  {
    icon: Briefcase,
    title: "Working developers",
    text: "Fill the gaps on the way to senior: testing, architecture, performance, security and system design.",
    start: "Start with: Middle & Senior",
    tone: "from-neon-amber to-neon-pink",
  },
];

export function AudienceSection() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Who it's for"
            eyebrowTone="amber"
            title={
              <>
                Wherever you start, <GradientText>keep climbing</GradientText>
              </>
            }
          />
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {audiences.map((a, i) => (
            <Reveal key={a.title} delay={i * 0.1} className="h-full">
              <GlassCard interactive className="flex h-full flex-col gap-4">
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-xl bg-gradient-to-br",
                    a.tone,
                  )}
                >
                  <a.icon className="size-5 text-white" />
                </span>
                <h3 className="text-lg font-semibold text-white">{a.title}</h3>
                <p className="text-white/80">{a.text}</p>
                <p className="mt-auto text-sm font-medium text-white/60">
                  {a.start}
                </p>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
