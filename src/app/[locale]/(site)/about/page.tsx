import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ProsePage } from "@/components/layout/prose-page";
import { GradientText } from "@/components/ui/gradient-text";
import { Link } from "@/i18n/navigation";
import { alternates, localeParam } from "@/lib/i18n";
import { siteConfig } from "@/lib/site";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/about">): Promise<Metadata> {
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: "pages.about" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: alternates("/about", locale),
  };
}

export default async function AboutPage({
  params,
}: PageProps<"/[locale]/about">) {
  const locale = await localeParam(params);
  setRequestLocale(locale);
  const t = await getTranslations("pages.about");
  const strong = (chunks: ReactNode) => <strong>{chunks}</strong>;

  return (
    <ProsePage
      eyebrow={t("eyebrow")}
      title={t.rich("title", {
        gradient: (chunks) => <GradientText>{chunks}</GradientText>,
      })}
      description={t("description")}
    >
      <h2>{t("why.title")}</h2>
      <p>{t.rich("why.body", { strong })}</p>

      <h2>{t("how.title")}</h2>
      <ul>
        <li>{t.rich("how.lessons", { strong })}</li>
        <li>{t.rich("how.browser", { strong })}</li>
        <li>{t.rich("how.motivation", { strong })}</li>
        <li>{t.rich("how.projects", { strong })}</li>
      </ul>

      <h2>{t("tested.title")}</h2>
      <p>{t("tested.body")}</p>

      <h2>{t("openSource.title")}</h2>
      <p>
        {t.rich("openSource.body", {
          github: (chunks) => <a href={siteConfig.githubUrl}>{chunks}</a>,
        })}
      </p>

      <h2>{t("contact.title")}</h2>
      <p>
        {t.rich("contact.body", {
          issue: (chunks) => <a href={siteConfig.contactUrl}>{chunks}</a>,
          link: (chunks) => <Link href="/languages">{chunks}</Link>,
        })}
      </p>
    </ProsePage>
  );
}
