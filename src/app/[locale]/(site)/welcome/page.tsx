import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { WelcomeSteps } from "@/components/welcome/welcome-steps";
import { Container } from "@/components/ui/container";
import { GradientText } from "@/components/ui/gradient-text";
import { getCourse } from "@/lib/content";
import { alternates, localeParam } from "@/lib/i18n";
import { languages } from "@/lib/languages";
import { getLearnerProfile } from "@/lib/learner-profile";
import { startLesson } from "@/lib/learning";
import { safeReturnPath } from "@/lib/return-path";
import { requireSession } from "@/lib/session";
import { START_LEVELS } from "@/lib/welcome";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/welcome">): Promise<Metadata> {
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: "welcome" });
  return {
    title: t("metaTitle"),
    robots: { index: false },
    alternates: alternates("/welcome", locale),
  };
}

/** New accounts land here after their first sign-in (and anyone can come back to change their goals). */
export default async function WelcomePage({
  params,
  searchParams,
}: PageProps<"/[locale]/welcome">) {
  const locale = await localeParam(params);
  setRequestLocale(locale);
  const { user } = await requireSession("/welcome");
  const { next } = await searchParams;
  const back = safeReturnPath(next, "");
  const profile = await getLearnerProfile(user.id);
  const t = await getTranslations("welcome");

  const options = languages.flatMap((language) => {
    const course = getCourse(language.slug, locale);
    if (!course) return [];
    return [
      {
        language,
        lessons: course.stats.lessons,
        starts: START_LEVELS.map(
          (level) => startLesson(language.slug, level, locale)?.title ?? null,
        ),
      },
    ];
  });
  const firstName = user.name.split(" ")[0] || user.name;

  return (
    <Container className="flex max-w-2xl flex-col gap-8 py-10 sm:py-14">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          <GradientText>{t("greeting", { name: firstName })}</GradientText>
        </h1>
        <p className="mt-2 text-muted-foreground">{t("intro")}</p>
      </div>
      <WelcomeSteps
        languages={options}
        initial={profile ?? {}}
        next={back}
        skipHref={back || "/dashboard"}
      />
    </Container>
  );
}
