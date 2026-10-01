import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ProsePage } from "@/components/layout/prose-page";
import { Link } from "@/i18n/navigation";
import { alternates, localeParam } from "@/lib/i18n";
import { siteConfig } from "@/lib/site";

/** Shown as "Last updated"; change it whenever the terms change. */
const updated = new Date("2026-10-01");

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/terms">): Promise<Metadata> {
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: "pages.terms" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: alternates("/terms", locale),
  };
}

export default async function TermsPage({
  params,
}: PageProps<"/[locale]/terms">) {
  const locale = await localeParam(params);
  setRequestLocale(locale);
  const t = await getTranslations("pages.terms");
  const issue = (chunks: ReactNode) => (
    <a href={siteConfig.contactUrl}>{chunks}</a>
  );

  return (
    <ProsePage
      eyebrow={t("eyebrow")}
      eyebrowTone="amber"
      title={t("title")}
      description={t("description")}
      updated={updated}
    >
      <h2>{t("using.title")}</h2>
      <p>
        {t.rich("using.body", {
          link: (chunks) => <Link href="/privacy">{chunks}</Link>,
        })}
      </p>

      <h2>{t("account.title")}</h2>
      <ul>
        <li>{t("account.signIn")}</li>
        <li>
          {t.rich("account.delete", {
            link: (chunks) => <Link href="/profile">{chunks}</Link>,
          })}
        </li>
        <li>{t("account.suspend")}</li>
      </ul>

      <h2>{t("code.title")}</h2>
      <p>{t("code.body")}</p>

      <h2>{t("content.title")}</h2>
      <p>
        {t.rich("content.body", {
          github: (chunks) => <a href={siteConfig.githubUrl}>{chunks}</a>,
        })}
      </p>

      <h2>{t("warranty.title")}</h2>
      <p>{t("warranty.body")}</p>

      <h2>{t("changes.title")}</h2>
      <p>{t("changes.body")}</p>

      <h2>{t("contact.title")}</h2>
      <p>{t.rich("contact.body", { issue })}</p>
    </ProsePage>
  );
}
