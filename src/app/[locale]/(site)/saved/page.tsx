import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SavedList } from "@/components/learning/saved-list";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { GradientText } from "@/components/ui/gradient-text";
import { SectionHeading } from "@/components/ui/section-heading";
import { Link } from "@/i18n/navigation";
import { alternates, localeParam } from "@/lib/i18n";
import { getSavedPages } from "@/lib/learning";
import { requireSession } from "@/lib/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/saved">): Promise<Metadata> {
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: "saved" });
  return {
    title: t("metaTitle"),
    robots: { index: false },
    alternates: alternates("/saved", locale),
  };
}

export default async function SavedPage({
  params,
}: PageProps<"/[locale]/saved">) {
  const locale = await localeParam(params);
  setRequestLocale(locale);
  const { user } = await requireSession("/saved");
  const pages = await getSavedPages(user.id, locale);
  const t = await getTranslations("saved");

  return (
    <Container className="flex max-w-3xl flex-col gap-8 py-10 sm:py-14">
      <SectionHeading
        as="h1"
        eyebrow={t("eyebrow")}
        title={t.rich("title", {
          gradient: (chunks) => <GradientText>{chunks}</GradientText>,
        })}
        description={t("description")}
      />
      <SavedList
        items={pages.map((page) => ({
          ...page,
          savedAt: page.savedAt.toISOString(),
        }))}
      />
      {pages.length === 0 && (
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild variant="gradient" size="lg" className="px-5">
            <Link href="/languages">{t("browse")}</Link>
          </Button>
          <Button asChild variant="glass" size="lg" className="px-5">
            <Link href="/practice">{t("practice")}</Link>
          </Button>
        </div>
      )}
    </Container>
  );
}
