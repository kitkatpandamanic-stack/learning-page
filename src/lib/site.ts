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
  /** The Telegram channel: daily problem and quiz */
  telegramUrl: "https://t.me/Kitkatpandamanic",
  /**
   * Search engine ownership checks (Google Search Console, Yandex Webmaster):
   * public codes printed in every page's <head>. Env vars can override them.
   */
  verification: {
    google: "dvB-I7SQ8LWxqBCXnH1-eRB2XlEeWAElCI1oXUtByjY",
    yandex: "2d182856cc262c37",
  },
};

/**
 * `label` is a key in the "nav" translations. `wideOnly` links are left out
 * of the top bar on tablet widths (they stay in the mobile menu and footer).
 */
export type NavLink = { label: string; href: string; wideOnly?: boolean };

export const mainNav: NavLink[] = [
  { label: "languages", href: "/languages" },
  { label: "practice", href: "/practice" },
  { label: "roadmap", href: "/#roadmap", wideOnly: true },
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
      { label: "sql", href: "/languages/sql" },
      { label: "allLanguages", href: "/languages" },
    ],
  },
  {
    title: "platform",
    links: [
      { label: "roadmap", href: "/#roadmap" },
      { label: "practice", href: "/practice" },
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
