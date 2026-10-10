"use client";

import * as React from "react";
import { useFormatter, useTranslations } from "next-intl";
import { BookmarkX } from "lucide-react";
import { toast } from "sonner";

import { LanguageMonogram } from "@/components/languages/language-card";
import { useToggleSaved } from "@/components/learning/use-learning";
import { DifficultyBadge } from "@/components/practice/difficulty-badge";
import { GlassCard } from "@/components/ui/glass-card";
import { Link } from "@/i18n/navigation";
import { languages } from "@/lib/languages";
import type { Difficulty } from "@/lib/practice-meta";

export type SavedItem = {
  permalink: string;
  kind: "lesson" | "problem";
  language: string;
  title: string;
  description: string;
  module?: string;
  difficulty?: Difficulty;
  savedAt: string;
};

/** Saved lessons and problems, each with a remove button (and undo). */
export function SavedList({ items }: { items: SavedItem[] }) {
  const t = useTranslations("saved");
  const format = useFormatter();
  const toggle = useToggleSaved();
  const [removed, setRemoved] = React.useState<string[]>([]);

  const remove = async (item: SavedItem) => {
    setRemoved((r) => [...r, item.permalink]);
    const result = await toggle(item.permalink, false);
    if (!result.ok) {
      setRemoved((r) => r.filter((p) => p !== item.permalink));
      toast.error(t("failed"));
      return;
    }
    toast(t("removedToast"), {
      description: item.title,
      action: {
        label: t("undo"),
        onClick: async () => {
          const again = await toggle(item.permalink, true);
          if (again.ok)
            setRemoved((r) => r.filter((p) => p !== item.permalink));
        },
      },
    });
  };

  const visible = items.filter((i) => !removed.includes(i.permalink));
  if (visible.length === 0) {
    return (
      <GlassCard className="text-center text-muted-foreground">
        {t("empty")}
      </GlassCard>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {visible.map((item) => {
        const language = languages.find((l) => l.slug === item.language);
        return (
          <li key={item.permalink}>
            <GlassCard
              padding="sm"
              className="flex items-center gap-4 transition-colors hover:bg-white/8"
            >
              {language && (
                <LanguageMonogram
                  language={language}
                  className="size-11 shrink-0 text-sm"
                />
              )}
              <Link href={item.permalink} className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-white">
                  {item.title}
                </span>
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/50">
                  <span>
                    {item.kind === "lesson" ? t("lesson") : t("problem")}
                    {item.module ? ` · ${item.module}` : ""}
                  </span>
                  {item.difficulty && (
                    <DifficultyBadge difficulty={item.difficulty} />
                  )}
                  <span>
                    {t("savedOn", {
                      date: format.dateTime(new Date(item.savedAt), {
                        dateStyle: "medium",
                      }),
                    })}
                  </span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => remove(item)}
                aria-label={`${t("remove")}: ${item.title}`}
                title={t("remove")}
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-white/50 ring-1 ring-white/12 hover:bg-white/8 hover:text-rose-300"
              >
                <BookmarkX className="size-4.5" />
              </button>
            </GlassCard>
          </li>
        );
      })}
    </ul>
  );
}
