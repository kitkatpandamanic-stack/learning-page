import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, CalendarCheck2, Layers } from "lucide-react";

import { ReviewSession } from "@/components/learning/review-session";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { SectionHeading } from "@/components/ui/section-heading";
import { Link } from "@/i18n/navigation";
import { alternates, localeParam } from "@/lib/i18n";
import { getContinue, getReviewSession } from "@/lib/learning";
import { getTimeZone } from "@/lib/progress";
import { requireSession } from "@/lib/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/review">): Promise<Metadata> {
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: "review" });
  return {
    title: t("metaTitle"),
    robots: { index: false },
    alternates: alternates("/review", locale),
  };
}

export default async function ReviewPage({
  params,
}: PageProps<"/[locale]/review">) {
  const locale = await localeParam(params);
  setRequestLocale(locale);
  const { user } = await requireSession("/review");
  const review = await getReviewSession(user.id, await getTimeZone(), locale);
  const t = await getTranslations("review");
  const tDashboard = await getTranslations("dashboard");

  let body: React.ReactNode;
  if (review.questions.length > 0) {
    body = (
      <ReviewSession
        key={review.questions.map((q) => q.ref).join()}
        questions={review.questions}
        waiting={review.waiting}
        dueTomorrow={review.dueTomorrow}
      />
    );
  } else if (review.deckSize === 0) {
    const { target } = await getContinue(user.id, locale);
    body = (
      <GlassCard className="flex flex-col items-center gap-3 text-center">
        <Layers className="size-8 text-violet-300" />
        <h2 className="text-xl font-bold text-white">{t("empty.title")}</h2>
        <p className="max-w-md text-muted-foreground">{t("empty.body")}</p>
        {target && (
          <Button asChild variant="gradient" size="lg" className="mt-2 px-5">
            <Link href={target.permalink}>
              {t("empty.action")} <ArrowRight />
            </Link>
          </Button>
        )}
      </GlassCard>
    );
  } else {
    body = (
      <GlassCard
        glow="lime"
        className="flex flex-col items-center gap-3 text-center"
      >
        <CalendarCheck2 className="size-8 text-lime-300" />
        <h2 className="text-xl font-bold text-white">{t("caughtUp.title")}</h2>
        <p className="text-muted-foreground">{t("caughtUp.body")}</p>
        <p className="text-sm text-white/50">
          {t("summary.tomorrow", { count: review.dueTomorrow })}{" "}
          {t("caughtUp.deck", { count: review.deckSize })}
        </p>
        <Button asChild variant="glass" size="lg" className="mt-2 px-5">
          <Link href="/dashboard">{tDashboard("metaTitle")}</Link>
        </Button>
      </GlassCard>
    );
  }

  return (
    <Container className="flex max-w-2xl flex-col gap-8 py-10 sm:py-14">
      <SectionHeading
        as="h1"
        eyebrow={t("eyebrow")}
        title={t.rich("title", {
          gradient: (chunks) => <GradientText>{chunks}</GradientText>,
        })}
        description={t("description")}
      />
      {body}
    </Container>
  );
}
