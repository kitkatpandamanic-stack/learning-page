import { getAllLessons, getLanguage, getLessonContext } from "@/lib/content";
import { ogSize, renderOgImage } from "@/lib/og";

export const alt = "PandaDev lesson";
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllLessons().map((l) => ({ lang: l.language, lesson: l.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; lesson: string }>;
}) {
  const { lang, lesson } = await params;
  const language = getLanguage(lang);
  const ctx = getLessonContext(lang, lesson);
  return renderOgImage({
    eyebrow: ctx
      ? `${language?.name} · Level ${ctx.level.level} ${ctx.level.name}`
      : (language?.name ?? "Lesson"),
    title: ctx?.lesson.title ?? "Lesson",
    subtitle: ctx?.lesson.description,
  });
}
