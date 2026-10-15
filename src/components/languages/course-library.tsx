import { getTranslations } from "next-intl/server";
import {
  BookOpen,
  CirclePlay,
  Dumbbell,
  ExternalLink,
  FileText,
  Globe,
  Library,
  Lock,
  Newspaper,
  NotebookPen,
  Presentation,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";

import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { localizedPath, type Locale } from "@/lib/i18n";
import { getCourseLibrary } from "@/lib/library";
import {
  groupLibrary,
  isLibraryType,
  levelNumber,
  libraryHref,
  type LibraryItem,
  type LibraryType,
} from "@/lib/library-items";
import { levels } from "@/lib/levels";
import { toneClasses } from "@/lib/tones";

const typeIcons: Record<LibraryType, LucideIcon> = {
  book: BookOpen,
  slides: Presentation,
  notes: NotebookPen,
  exercises: Dumbbell,
  video: CirclePlay,
  article: Newspaper,
  website: Globe,
};

/**
 * The course's shelf from the book library, grouped by level with the page's
 * language first. Says "coming soon" until storage is set up or the course
 * has books, so a missing bucket never breaks the page.
 */
export async function CourseLibrary({
  slug,
  locale,
}: {
  slug: string;
  locale: Locale;
}) {
  const t = await getTranslations("course.library");
  const tl = await getTranslations("levels");
  const library = await getCourseLibrary(slug);
  const groups = groupLibrary(library?.items ?? [], locale);
  const from = localizedPath(`/languages/${slug}`, locale);

  return (
    <section
      id="library"
      aria-labelledby="library-title"
      className="flex scroll-mt-24 flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <h2
          id="library-title"
          className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white sm:text-3xl"
        >
          <Library className="size-7 text-violet-300" /> {t("title")}
        </h2>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {groups.length === 0 ? (
        <p className="flex items-center gap-3 rounded-2xl border border-dashed border-white/15 px-4 py-4 text-sm text-white/60">
          <BookOpen className="size-5 shrink-0" /> {t("comingSoon")}
        </p>
      ) : (
        <>
          <p className="flex items-center gap-2 text-sm text-white/55">
            <Lock className="size-4 shrink-0" /> {t("signInHint")}
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {groups.map((group) => {
              const level =
                group.level === null ? null : levels[levelNumber[group.level]];
              const tone = toneClasses[level?.tone ?? "violet"];
              const Icon = level?.icon ?? Library;
              return (
                <GlassCard
                  key={group.level ?? "other"}
                  className="flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="flex items-center gap-3 text-lg font-semibold text-white">
                      <span
                        className={cn(
                          "flex size-9 items-center justify-center rounded-xl",
                          tone.soft,
                          tone.text,
                        )}
                      >
                        <Icon className="size-4.5" />
                      </span>
                      {level ? (
                        <span>
                          <span
                            className={cn(
                              "block font-mono text-xs font-normal uppercase",
                              tone.text,
                            )}
                          >
                            {tl("level", { level: level.level })}
                          </span>
                          {tl(`${level.level}.name`)}
                        </span>
                      ) : (
                        t("other")
                      )}
                    </h3>
                    <Badge tone="neutral">
                      {t("count", { count: group.items.length })}
                    </Badge>
                  </div>
                  <ul className="flex flex-col gap-1">
                    {group.items.map((item) => (
                      <LibraryRow key={item.id} item={item} from={from} t={t} />
                    ))}
                  </ul>
                </GlassCard>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

function LibraryRow({
  item,
  from,
  t,
}: {
  item: LibraryItem;
  from: string;
  t: Awaited<ReturnType<typeof getTranslations<"course.library">>>;
}) {
  const href = libraryHref(item);
  if (!href) return null;
  const type = isLibraryType(item.type) ? item.type : null;
  const Icon = type ? typeIcons[type] : FileText;
  const lang = item.lang === "en" || item.lang === "ru" ? item.lang : null;
  const external = !item.file;

  return (
    <li>
      {/* A plain <a>: the API route has no locale prefix, and files are
          redirects, not pages to prefetch. */}
      <a
        href={external ? href : `${href}?from=${encodeURIComponent(from)}`}
        target="_blank"
        rel={external ? "noopener noreferrer" : "noopener"}
        className="group flex items-start gap-3 rounded-xl px-2 py-2 transition hover:bg-white/6"
      >
        <Icon className="mt-0.5 size-4 shrink-0 text-white/55 group-hover:text-white" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm text-white/85 group-hover:text-white">
            {item.title}
            {external && (
              <ExternalLink className="ml-1.5 inline size-3 text-white/40" />
            )}
          </span>
          <span className="text-xs text-white/55">
            {[
              t(`types.${type ?? "other"}`),
              item.author,
              item.size
                ? t("size", { size: Math.round(item.size / 100_000) / 10 })
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </span>
        {lang && (
          <span
            title={t(`langName.${lang}`)}
            className="shrink-0 rounded-md border border-white/15 px-1.5 py-0.5 font-mono text-[10px] text-white/60"
          >
            {t(`lang.${lang}`)}
          </span>
        )}
        <span className="sr-only">{t("opensInNewTab")}</span>
      </a>
    </li>
  );
}
