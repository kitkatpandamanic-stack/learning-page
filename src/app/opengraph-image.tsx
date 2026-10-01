import { ogSize, renderOgImage } from "@/lib/og";

export const alt = "PandaDev: learn to code from Zero to Senior";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({
    eyebrow: "Learn to code the fun way",
    title: "From Zero to Senior.",
    subtitle:
      "Interactive lessons, real coding exercises and projects for JavaScript, Python, TypeScript and more.",
  });
}
