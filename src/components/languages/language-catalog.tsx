"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { cn } from "cn";

import {
  LanguageCard,
  type LanguageSlug,
} from "@/components/languages/language-card";
import { Input } from "@/components/ui/input";
import type { CourseStats } from "@/lib/content";
import type { Language } from "@/lib/languages";

const filters = [
  { value: "all", labelKey: "all" },
  { value: "available", labelKey: "available" },
  { value: "coming-soon", labelKey: "comingSoon" },
] as const;

type Filter = (typeof filters)[number]["value"];

export function LanguageCatalog({
  items,
}: {
  items: { language: Language; stats?: CourseStats }[];
}) {
  const t = useTranslations("languages");
  const info = useTranslations("languageInfo");
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("all");

  const q = query.trim().toLowerCase();
  const visible = items.filter(({ language }) => {
    const matchesFilter = filter === "all" || language.status === filter;
    const slug = language.slug as LanguageSlug;
    // Match the English text too, so "web" finds JavaScript in any language.
    const matchesQuery =
      !q ||
      [
        language.name,
        language.description,
        ...language.usedFor,
        info(`${slug}.description`),
        ...(info.raw(`${slug}.usedFor`) as string[]),
      ].some((text) => text.toLowerCase().includes(q));
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="group"
          aria-label={t("filters.label")}
          className="inline-flex flex-wrap self-start rounded-full p-1 glass"
        >
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium text-white/70 transition hover:text-white",
                filter === f.value &&
                  "bg-gradient-brand text-white shadow-glow-violet",
              )}
            >
              {t(`filters.${f.labelKey}`)}
            </button>
          ))}
        </div>

        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/40" />
          <label htmlFor="language-search" className="sr-only">
            {t("search.label")}
          </label>
          <Input
            id="language-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search.placeholder")}
            className="h-10 rounded-full bg-white/5 pl-10"
          />
        </div>
      </div>

      {visible.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(({ language, stats }) => (
            <LanguageCard
              key={language.slug}
              language={language}
              stats={stats}
              headingLevel={2}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl p-10 text-center text-muted-foreground glass">
          {t("noResults", { query: query.trim() })}
        </p>
      )}
    </div>
  );
}
