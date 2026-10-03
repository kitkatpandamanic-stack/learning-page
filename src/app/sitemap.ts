import type { MetadataRoute } from "next";

import { getAllLessons } from "@/lib/content";
import { getAllProblems, getPracticeLanguages } from "@/lib/practice";
import { locales, localizedPath } from "@/lib/i18n";
import { languages } from "@/lib/languages";
import { siteUrl } from "@/lib/site";

type Entry = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

/** Every page in every language, each linked to its translations (hreflang). */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: Entry[] = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/languages", changeFrequency: "weekly", priority: 0.9 },
    { path: "/playground", changeFrequency: "monthly", priority: 0.7 },
    { path: "/practice", changeFrequency: "weekly", priority: 0.8 },
    ...["/about", "/pricing", "/privacy", "/terms"].map((path) => ({
      path,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
    ...languages.map((l) => ({
      path: `/languages/${l.slug}`,
      changeFrequency: "weekly" as const,
      priority: l.status === "available" ? 0.8 : 0.4,
    })),
    ...getAllLessons().map((lesson) => ({
      path: lesson.permalink,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...getPracticeLanguages().map((language) => ({
      path: `/practice/${language}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...getAllProblems().map((problem) => ({
      path: problem.permalink,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];

  const url = (path: string, locale: (typeof locales)[number]) =>
    `${siteUrl}${localizedPath(path, locale)}`.replace(/\/$/, "") || siteUrl;

  return pages.flatMap(({ path, changeFrequency, priority }) =>
    locales.map((locale) => ({
      url: url(path, locale),
      changeFrequency,
      priority,
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, url(path, l)])),
      },
    })),
  );
}
