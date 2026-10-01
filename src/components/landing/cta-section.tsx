import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { LogoMark } from "@/components/brand/logo";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { GradientText } from "@/components/ui/gradient-text";

const points = [
  "Free Beginner track",
  "Code right in your browser",
  "Track XP, streaks and progress",
];

export function CtaSection() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <Reveal>
          {/* Gradient border: a 1px gradient wrapper around the glass panel */}
          <div className="rounded-3xl bg-gradient-to-r from-neon-violet/70 via-neon-pink/50 to-neon-cyan/70 p-px shadow-glow-violet">
            <div className="relative grid items-center gap-8 overflow-hidden rounded-[calc(1.5rem-1px)] bg-space-900/85 px-6 py-10 backdrop-blur-xl sm:px-10 lg:grid-cols-[auto_1fr_auto] lg:gap-10">
              <div
                aria-hidden
                className="absolute -top-24 -left-10 size-72 rounded-full bg-neon-violet/40 blur-[90px]"
              />
              <div
                aria-hidden
                className="absolute -right-10 -bottom-24 size-72 rounded-full bg-neon-cyan/30 blur-[90px]"
              />

              <div className="relative mx-auto flex size-24 items-center justify-center rounded-3xl bg-white/5 ring-1 ring-white/15 lg:mx-0">
                <LogoMark className="size-16 drop-shadow-[0_0_24px_rgb(139_92_246/0.9)] motion-safe:animate-float" />
              </div>

              <div className="relative text-center lg:text-left">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Ready to write your{" "}
                  <GradientText>first line of code?</GradientText>
                </h2>
                <ul className="mt-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-6 lg:justify-start">
                  {points.map((point) => (
                    <li
                      key={point}
                      className="flex items-center gap-2 text-sm text-white/80"
                    >
                      <span className="flex size-5 items-center justify-center rounded-full bg-neon-lime/20 text-lime-300">
                        <Check className="size-3" />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                asChild
                variant="gradient"
                size="xl"
                className="relative mx-auto lg:mx-0"
              >
                <Link href="/languages">
                  Start learning free <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
