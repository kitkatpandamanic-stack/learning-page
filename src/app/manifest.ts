import type { MetadataRoute } from "next";

/** Lets learners install PandaDev on their phone or desktop like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PandaDev",
    short_name: "PandaDev",
    description:
      "Learn to code from zero to senior, with lessons and exercises that run in your browser.",
    start_url: "/",
    display: "standalone",
    background_color: "#070814",
    theme_color: "#070814",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
