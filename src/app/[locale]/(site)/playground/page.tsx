import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Playground } from "@/components/code/playground";
import { Container } from "@/components/ui/container";
import { GradientText } from "@/components/ui/gradient-text";
import { SectionHeading } from "@/components/ui/section-heading";
import { alternates, localeParam } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/playground">): Promise<Metadata> {
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: "playground" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: alternates("/playground", locale),
  };
}

export default async function PlaygroundPage({
  params,
}: PageProps<"/[locale]/playground">) {
  const locale = await localeParam(params);
  setRequestLocale(locale);
  const t = await getTranslations("playground");

  return (
    <Container className="flex max-w-5xl flex-col gap-10 py-12 sm:py-16">
      <SectionHeading
        as="h1"
        eyebrow={t("eyebrow")}
        eyebrowTone="cyan"
        title={t.rich("title", {
          gradient: (chunks) => <GradientText>{chunks}</GradientText>,
        })}
        description={t("description")}
      />
      <Playground />
    </Container>
  );
}
