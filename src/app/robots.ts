import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/design",
        "/dashboard",
        "/profile",
        "/sign-in",
        "/ru/design",
        "/ru/dashboard",
        "/ru/profile",
        "/ru/sign-in",
        "/api/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
