import type { MetadataRoute } from "next";

import { getAllLessons } from "@/lib/content";
import { languages } from "@/lib/languages";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    {
      url: `${siteUrl}/languages`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/playground`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...["/about", "/pricing", "/privacy", "/terms"].map((path) => ({
      url: `${siteUrl}${path}`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
    ...languages.map((l) => ({
      url: `${siteUrl}/languages/${l.slug}`,
      changeFrequency: "weekly" as const,
      priority: l.status === "available" ? 0.8 : 0.4,
    })),
    ...getAllLessons().map((lesson) => ({
      url: `${siteUrl}${lesson.permalink}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
