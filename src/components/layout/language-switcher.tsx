"use client";

import { useLocale, useTranslations } from "next-intl";
import { cn } from "cn";

import { Link, usePathname } from "@/i18n/navigation";
import { locales } from "@/lib/i18n";

const labels = { en: "EN", ru: "RU" } as const;
const names = { en: "English", ru: "Русский" } as const;

/** EN | RU toggle that keeps you on the same page in the other language. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <div
      role="group"
      aria-label={t("chooseLanguage")}
      className={cn(
        "flex items-center rounded-full bg-white/6 p-0.5 text-xs font-semibold ring-1 ring-white/10",
        className,
      )}
    >
      {locales.map((l) => (
        <Link
          key={l}
          href={pathname}
          locale={l}
          hrefLang={l}
          lang={l}
          aria-label={names[l]}
          aria-current={l === locale ? "true" : undefined}
          className="rounded-full px-2.5 py-1 text-white/60 transition hover:text-white aria-[current=true]:bg-white/12 aria-[current=true]:text-white"
        >
          {labels[l]}
        </Link>
      ))}
    </div>
  );
}
