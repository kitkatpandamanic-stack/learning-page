/** Absolute site URL for metadata and the sitemap. Vercel sets the production domain at build time. */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

export const siteConfig = {
  name: "PandaDev",
  tagline: "Learn programming from Zero to Senior.",
  githubUrl: "https://github.com/kitkatpandamanic-stack/learning-page",
};

export type NavLink = { label: string; href: string };

export const mainNav: NavLink[] = [
  { label: "Languages", href: "/languages" },
  { label: "Roadmap", href: "/#roadmap" },
  { label: "Playground", href: "/playground" },
  { label: "Pricing", href: "/pricing" },
];

export const footerNav: { title: string; links: NavLink[] }[] = [
  {
    title: "Learn",
    links: [
      { label: "JavaScript", href: "/languages/javascript" },
      { label: "Python", href: "/languages/python" },
      { label: "TypeScript", href: "/languages/typescript" },
      { label: "All languages", href: "/languages" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Roadmap", href: "/#roadmap" },
      { label: "Playground", href: "/playground" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
];
