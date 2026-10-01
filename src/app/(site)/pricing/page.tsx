import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "PandaDev is free during the beta: every lesson, exercise and feature.",
  alternates: { canonical: "/pricing" },
};

const included = [
  "Every lesson in every language",
  "In-browser code editor with automatic checks",
  "Quizzes, XP, levels, streaks and achievements",
  "Progress saved across your devices",
  "The playground, as much as you like",
];

const faq = [
  {
    q: "Is it really free?",
    a: "Yes. During the beta everything is free, with no credit card and no trial that runs out.",
  },
  {
    q: "Do I need an account?",
    a: "No. You can read every lesson and run every exercise without one. Sign in to save your progress, XP and streaks.",
  },
  {
    q: "What do I need to start?",
    a: "Just a browser. Everything, including running your code, happens right on the page.",
  },
];

export default function PricingPage() {
  return (
    <Container className="flex max-w-4xl flex-col gap-12 py-12 sm:py-16">
      <SectionHeading
        as="h1"
        eyebrow="Pricing"
        eyebrowTone="lime"
        title={
          <>
            Free while we&apos;re in <GradientText>beta</GradientText>
          </>
        }
        description="No plans to compare and no credit card. Just start learning."
      />

      <div className="rounded-3xl bg-gradient-to-r from-neon-violet/70 via-neon-pink/50 to-neon-cyan/70 p-px shadow-glow-violet">
        <div className="grid gap-8 rounded-[calc(1.5rem-1px)] bg-space-900/90 p-8 backdrop-blur-xl sm:p-10 md:grid-cols-[1fr_1.2fr] md:items-center">
          <div className="flex flex-col gap-3">
            <Badge tone="lime" dot className="self-start">
              Beta
            </Badge>
            <p className="text-5xl font-extrabold text-white">
              $0
              <span className="text-lg font-medium text-white/50">
                {" "}
                during the beta
              </span>
            </p>
            <p className="text-muted-foreground">
              Everything PandaDev offers today, for everyone.
            </p>
            <Button
              asChild
              variant="gradient"
              size="xl"
              className="mt-2 self-start"
            >
              <Link href="/languages">
                Start learning <ArrowRight />
              </Link>
            </Button>
          </div>
          <ul className="flex flex-col gap-3">
            {included.map((item) => (
              <li key={item} className="flex items-start gap-3 text-white/85">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-neon-lime/20 text-lime-300">
                  <Check className="size-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-white">Questions</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {faq.map((item) => (
            <GlassCard key={item.q} className="flex flex-col gap-2">
              <h3 className="font-semibold text-white">{item.q}</h3>
              <p className="text-sm text-muted-foreground">{item.a}</p>
            </GlassCard>
          ))}
        </div>
      </section>
    </Container>
  );
}
