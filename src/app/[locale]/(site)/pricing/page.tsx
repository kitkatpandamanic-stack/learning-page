import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { SectionHeading } from "@/components/ui/section-heading";
import { Link } from "@/i18n/navigation";
import { alternates, localeParam } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/pricing">): Promise<Metadata> {
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: "pages.pricing" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: alternates("/pricing", locale),
  };
}

const included = [
  "lessons",
  "editor",
  "gamification",
  "sync",
  "playground",
] as const;

const faq = ["free", "account", "start"] as const;

export default async function PricingPage({
  params,
}: PageProps<"/[locale]/pricing">) {
  const locale = await localeParam(params);
  setRequestLocale(locale);
  const t = await getTranslations("pages.pricing");
  const tCommon = await getTranslations("common");

  return (
    <Container className="flex max-w-4xl flex-col gap-12 py-12 sm:py-16">
      <SectionHeading
        as="h1"
        eyebrow={t("eyebrow")}
        eyebrowTone="lime"
        title={t.rich("title", {
          gradient: (chunks) => <GradientText>{chunks}</GradientText>,
        })}
        description={t("description")}
      />

      <div className="rounded-3xl bg-gradient-to-r from-neon-violet/70 via-neon-pink/50 to-neon-cyan/70 p-px shadow-glow-violet">
        <div className="grid gap-8 rounded-[calc(1.5rem-1px)] bg-space-900/90 p-8 backdrop-blur-xl sm:p-10 md:grid-cols-[1fr_1.2fr] md:items-center">
          <div className="flex flex-col gap-3">
            <Badge tone="lime" dot className="self-start">
              {t("badge")}
            </Badge>
            <p className="text-5xl font-extrabold text-white">
              {t("price")}
              <span className="text-lg font-medium text-white/50">
                {" "}
                {t("priceNote")}
              </span>
            </p>
            <p className="text-muted-foreground">{t("summary")}</p>
            <Button
              asChild
              variant="gradient"
              size="xl"
              className="mt-2 self-start"
            >
              <Link href="/languages">
                {tCommon("startLearning")} <ArrowRight />
              </Link>
            </Button>
          </div>
          <ul className="flex flex-col gap-3">
            {included.map((key) => (
              <li key={key} className="flex items-start gap-3 text-white/85">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-neon-lime/20 text-lime-300">
                  <Check className="size-3" />
                </span>
                {t(`included.${key}`)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-white">{t("faqTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {faq.map((key) => (
            <GlassCard key={key} className="flex flex-col gap-2">
              <h3 className="font-semibold text-white">{t(`faq.${key}.q`)}</h3>
              <p className="text-sm text-muted-foreground">
                {t(`faq.${key}.a`)}
              </p>
            </GlassCard>
          ))}
        </div>
      </section>
    </Container>
  );
}
