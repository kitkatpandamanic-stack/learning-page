import { getCourse, getLanguage } from "@/lib/content";
import { languages } from "@/lib/languages";
import { ogSize, renderOgImage } from "@/lib/og";

export const alt = "PandaDev course roadmap";
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return languages.map((l) => ({ lang: l.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const language = getLanguage(lang);
  const course = getCourse(lang);
  return renderOgImage({
    eyebrow: course
      ? `${course.stats.modules} modules · 4 levels`
      : "Coming soon",
    title: `Learn ${language?.name ?? "to code"}`,
    subtitle: "From your first line of code to senior developer.",
  });
}
