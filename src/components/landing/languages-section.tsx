import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "cn";

import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { SectionHeading } from "@/components/ui/section-heading";
import { languages, type Language } from "@/lib/languages";

function LanguageCard({ language }: { language: Language }) {
  const available = language.status === "available";

  return (
    <GlassCard
      asChild
      interactive
      className={cn("group flex h-full flex-col gap-4", language.color.border)}
    >
      <Link href={`/languages/${language.slug}`}>
        <div className="flex items-start justify-between">
          <span
            className={cn(
              "flex size-12 items-center justify-center rounded-xl font-mono text-lg font-bold ring-1 ring-white/10",
              language.color.soft,
              language.color.text,
            )}
          >
            {language.monogram}
          </span>
          {available ? (
            <Badge tone="lime" dot>
              Available
            </Badge>
          ) : (
            <Badge tone="neutral">Coming soon</Badge>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <h3 className="flex items-center gap-1.5 text-lg font-semibold text-white">
            {language.name}
            <ArrowUpRight className="size-4 text-white/40 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
          </h3>
          <p className="text-sm text-muted-foreground">
            {language.description}
          </p>
        </div>

        <ul className="mt-auto flex flex-wrap gap-1.5">
          {language.usedFor.map((tag) => (
            <li
              key={tag}
              className="rounded-md bg-white/6 px-2 py-0.5 text-xs text-white/70"
            >
              {tag}
            </li>
          ))}
        </ul>
      </Link>
    </GlassCard>
  );
}

export function LanguagesSection() {
  return (
    <section id="languages" className="scroll-mt-28 py-16 sm:py-20">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Languages"
            title={
              <>
                Pick a language. <GradientText>Start today.</GradientText>
              </>
            }
            description="Every language follows the same four-level path, so you always know what to learn next."
          />
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {languages.map((language, i) => (
            <Reveal key={language.slug} delay={(i % 3) * 0.08}>
              <LanguageCard language={language} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
