/** Absolute site URL for metadata and the sitemap. Vercel sets the production domain at build time. */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

export const siteConfig = {
  name: "PandaDev",
  githubUrl: "https://github.com/kitkatpandamanic-stack/learning-page",
  /** Where people can reach us: GitHub Issues on the public repo */
  contactUrl: "https://github.com/kitkatpandamanic-stack/learning-page/issues",
};

/** `label` is a key in the "nav" translations. */
export type NavLink = { label: string; href: string };

export const mainNav: NavLink[] = [
  { label: "languages", href: "/languages" },
  { label: "roadmap", href: "/#roadmap" },
  { label: "playground", href: "/playground" },
  { label: "pricing", href: "/pricing" },
];

/** Group titles and labels are keys in the "footer" and "nav" translations. */
export const footerNav: { title: string; links: NavLink[] }[] = [
  {
    title: "learn",
    links: [
      { label: "javascript", href: "/languages/javascript" },
      { label: "python", href: "/languages/python" },
      { label: "typescript", href: "/languages/typescript" },
      { label: "allLanguages", href: "/languages" },
    ],
  },
  {
    title: "platform",
    links: [
      { label: "roadmap", href: "/#roadmap" },
      { label: "playground", href: "/playground" },
      { label: "dashboard", href: "/dashboard" },
      { label: "pricing", href: "/pricing" },
    ],
  },
  {
    title: "company",
    links: [
      { label: "about", href: "/about" },
      {
        label: "contact",
        href: "https://github.com/kitkatpandamanic-stack/learning-page/issues",
      },
    ],
  },
];
