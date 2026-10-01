import type { ReactNode } from "react";
import { useFormatter, useTranslations } from "next-intl";

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
  /** "Last updated" date shown under the heading (a calendar day, read as UTC) */
  updated?: Date;
  children: ReactNode;
}) {
  const t = useTranslations("pages.prose");
  const format = useFormatter();
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
                {t("lastUpdated", {
                  date: format.dateTime(updated, {
                    dateStyle: "long",
                    timeZone: "UTC",
                  }),
                })}
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
