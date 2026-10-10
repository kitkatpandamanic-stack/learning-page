import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

const privatePages = [
  "/admin",
  "/design",
  "/dashboard",
  "/profile",
  "/review",
  "/saved",
  "/sign-in",
  "/welcome",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        // Signed-in pages and tools: nothing for search results there.
        ...privatePages.flatMap((page) => [page, `/ru${page}`]),
        "/api/",
        "/search/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
