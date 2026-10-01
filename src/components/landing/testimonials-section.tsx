import { Quote, Star } from "lucide-react";
import { cn } from "cn";

import { Reveal } from "@/components/motion/reveal";
import { Container } from "@/components/ui/container";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { SectionHeading } from "@/components/ui/section-heading";

// TODO(before launch): placeholder quotes. Replace with real learner feedback.
const testimonials = [
  {
    quote:
      "I had never written a line of code. The Beginner track made it click, and three months later I shipped my first website.",
    name: "Sarah K.",
    role: "Career switcher",
    avatar: "from-neon-violet to-neon-pink",
  },
  {
    quote:
      "Running code right inside the lesson is a game changer. I practise on my phone during my commute.",
    name: "David L.",
    role: "Computer science student",
    avatar: "from-neon-cyan to-neon-violet",
  },
  {
    quote:
      "The Middle and Senior levels go way beyond syntax: testing, architecture, system design. Exactly what I needed for my promotion.",
    name: "Priya P.",
    role: "Frontend developer",
    avatar: "from-neon-amber to-neon-pink",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Loved by learners"
            eyebrowTone="amber"
            title={
              <>
                Made for people who <GradientText>actually ship</GradientText>
              </>
            }
          />
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.1} className="h-full">
              <GlassCard interactive className="flex h-full flex-col gap-5">
                <div className="flex items-center justify-between">
                  <Quote className="size-7 text-violet-400" />
                  <div
                    className="flex gap-0.5"
                    aria-label="5 out of 5 stars"
                    role="img"
                  >
                    {Array.from({ length: 5 }, (_, s) => (
                      <Star
                        key={s}
                        className="size-3.5 fill-neon-amber text-neon-amber"
                      />
                    ))}
                  </div>
                </div>
                <p className="text-white/85">{t.quote}</p>
                <div className="mt-auto flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white",
                      t.avatar,
                    )}
                  >
                    {t.name[0]}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
