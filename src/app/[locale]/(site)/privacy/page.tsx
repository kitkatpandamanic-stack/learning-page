import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ProsePage } from "@/components/layout/prose-page";
import { Link } from "@/i18n/navigation";
import { alternates, localeParam } from "@/lib/i18n";
import { siteConfig } from "@/lib/site";

/** Shown as "Last updated"; change it whenever the policy changes. */
const updated = new Date("2026-10-01");

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: "pages.privacy" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: alternates("/privacy", locale),
  };
}

export default async function PrivacyPage({
  params,
}: PageProps<"/[locale]/privacy">) {
  const locale = await localeParam(params);
  setRequestLocale(locale);
  const t = await getTranslations("pages.privacy");
  const strong = (chunks: ReactNode) => <strong>{chunks}</strong>;

  return (
    <ProsePage
      eyebrow={t("eyebrow")}
      eyebrowTone="cyan"
      title={t("title")}
      description={t("description")}
      updated={updated}
    >
      <h2>{t("collect.title")}</h2>
      <ul>
        <li>{t.rich("collect.account", { strong })}</li>
        <li>{t.rich("collect.progress", { strong })}</li>
        <li>{t.rich("collect.signIn", { strong })}</li>
      </ul>

      <h2>{t("device.title")}</h2>
      <ul>
        <li>{t.rich("device.code", { strong })}</li>
        <li>{t.rich("device.timeZone", { strong })}</li>
      </ul>

      <h2>{t("cookies.title")}</h2>
      <p>{t("cookies.body")}</p>

      <h2>{t("analytics.title")}</h2>
      <p>{t("analytics.vercel")}</p>
      <p>{t("analytics.sentry")}</p>

      <h2>{t("processors.title")}</h2>
      <ul>
        <li>{t.rich("processors.vercel", { strong })}</li>
        <li>{t.rich("processors.neon", { strong })}</li>
        <li>{t.rich("processors.sentry", { strong })}</li>
        <li>{t.rich("processors.signIn", { strong })}</li>
        <li>{t.rich("processors.jsdelivr", { strong })}</li>
      </ul>
      <p>{t("processors.noSale")}</p>

      <h2>{t("deletion.title")}</h2>
      <p>
        {t.rich("deletion.body", {
          strong,
          link: (chunks) => <Link href="/profile">{chunks}</Link>,
        })}
      </p>

      <h2>{t("questions.title")}</h2>
      <p>
        {t.rich("questions.body", {
          issue: (chunks) => <a href={siteConfig.contactUrl}>{chunks}</a>,
        })}
      </p>
    </ProsePage>
  );
}
