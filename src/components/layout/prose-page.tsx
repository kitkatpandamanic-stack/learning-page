import type { ReactNode } from "react";

import { Container } from "@/components/ui/container";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Tone } from "@/lib/tones";

/** Simple text page (about, legal) on a glass card. */
export function ProsePage({
  eyebrow,
  eyebrowTone,
  title,
  description,
  updated,
  children,
}: {
  eyebrow: string;
  eyebrowTone?: Tone;
  title: ReactNode;
  description?: ReactNode;
  /** "Last updated" date shown under the heading */
  updated?: string;
  children: ReactNode;
}) {
  return (
    <Container className="flex max-w-3xl flex-col gap-10 py-12 sm:py-16">
      <SectionHeading
        as="h1"
        eyebrow={eyebrow}
        eyebrowTone={eyebrowTone}
        title={title}
        description={
          <>
            {description}
            {updated && (
              <span className="mt-2 block text-sm text-white/45">
                Last updated: {updated}
              </span>
            )}
          </>
        }
      />
      <GlassCard
        padding="lg"
        className="prose max-w-none prose-invert prose-headings:font-bold prose-headings:text-white prose-h2:mt-10 prose-h2:text-xl prose-p:text-white/80 prose-a:text-cyan-300 prose-strong:text-white prose-li:text-white/80 prose-li:marker:text-violet-400"
      >
        {children}
      </GlassCard>
    </Container>
  );
}
