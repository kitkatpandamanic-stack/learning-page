import type { Metadata } from "next";

import { localizedPath, type Locale } from "@/lib/i18n";
import { siteConfig, siteUrl } from "@/lib/site";

/**
 * Open Graph for a page. A page's `openGraph` replaces the layout's instead
 * of merging with it, so the site name and locale are repeated here.
 */
export function pageOpenGraph(
  locale: Locale,
  og: {
    title: string;
    description?: string;
    path: string;
    type?: "article" | "website";
  },
): Metadata["openGraph"] {
  return {
    siteName: siteConfig.name,
    locale: locale === "ru" ? "ru_RU" : "en_US",
    title: og.title,
    description: og.description,
    url: localizedPath(og.path, locale),
    type: og.type ?? "article",
  };
}

const absolute = (path: string, locale: Locale) =>
  `${siteUrl}${localizedPath(path, locale)}`.replace(/\/$/, "") || siteUrl;

const provider = {
  "@type": "EducationalOrganization",
  name: siteConfig.name,
  url: siteUrl,
};

/** "Languages › Python › Loops": shown instead of the URL in search results. */
export function breadcrumbJsonLd(
  locale: Locale,
  items: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absolute(item.path, locale),
    })),
  };
}

/** A lesson or a practice problem: a free learning resource. */
export function learningResourceJsonLd(
  locale: Locale,
  page: {
    name: string;
    description?: string;
    path: string;
    kind: "lesson" | "problem";
    language: string;
    level?: string;
    minutes?: number;
  },
) {
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: page.name,
    description: page.description,
    url: absolute(page.path, locale),
    inLanguage: locale,
    learningResourceType: page.kind === "lesson" ? "Lesson" : "Exercise",
    educationalLevel: page.level,
    teaches: page.language,
    timeRequired: page.minutes ? `PT${page.minutes}M` : undefined,
    isAccessibleForFree: true,
    provider,
  };
}

/** The home page: the site and who runs it. */
export function siteJsonLd(locale: Locale, description: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteConfig.name,
      url: absolute("/", locale),
      inLanguage: locale,
      description,
    },
    {
      "@context": "https://schema.org",
      ...provider,
      logo: `${siteUrl}/icon.svg`,
      sameAs: [siteConfig.githubUrl, siteConfig.telegramUrl],
    },
  ];
}
