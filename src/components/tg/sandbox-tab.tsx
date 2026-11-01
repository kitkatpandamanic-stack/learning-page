"use client";

import { NextIntlClientProvider, useMessages } from "next-intl";
import { useEffect } from "react";

import { LazyCodeRunner } from "@/components/code/lazy-code-runner";
import { starters } from "@/components/code/playground";
import { haptic, webApp } from "@/components/tg/telegram";
import {
  sandboxKeys,
  sandboxLanguages,
  type SandboxLanguage,
} from "@/lib/tg-app/sandbox";
import { appTexts, languageNames, type AppLocale } from "@/lib/tg-app/texts";
import enAchievements from "../../../messages/en/achievements.json";
import enProgress from "../../../messages/en/progress.json";
import enRunner from "../../../messages/en/runner.json";
import ruAchievements from "../../../messages/ru/achievements.json";
import ruProgress from "../../../messages/ru/progress.json";
import ruRunner from "../../../messages/ru/runner.json";

// The runner's own words (Run, Stop, errors) follow the app's language,
// which comes from the account or Telegram, not from the page's URL.
const runnerMessages = {
  en: {
    runner: enRunner,
    progress: enProgress,
    achievements: enAchievements,
  },
  ru: {
    runner: ruRunner,
    progress: ruProgress,
    achievements: ruAchievements,
  },
};

/**
 * The Code tab: the site's playground for Python, JavaScript, SQL and
 * TypeScript, with a row of keys the phone keyboard hides. Code runs on the
 * device and is saved there, per language.
 */
export function SandboxTab({
  locale,
  language,
  onLanguage,
}: {
  locale: AppLocale;
  language: SandboxLanguage;
  onLanguage: (language: SandboxLanguage) => void;
}) {
  const t = appTexts[locale];
  const messages = useMessages();

  // Swiping down in the editor scrolls the code instead of closing the app.
  useEffect(() => {
    const tg = webApp();
    if (!tg?.isVersionAtLeast("7.7")) return;
    tg.disableVerticalSwipes?.();
    return () => tg.enableVerticalSwipes?.();
  }, []);

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={{ ...messages, ...runnerMessages[locale] }}
      timeZone="UTC"
    >
      <section className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-white">💻 {t.codeTitle}</h1>
          <p className="text-slate-300">{t.codeIntro}</p>
        </header>
        <div
          role="group"
          aria-label={t.codeLanguage}
          className="flex gap-1 overflow-x-auto rounded-full p-1 glass"
        >
          {sandboxLanguages.map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={language === name}
              onClick={() => {
                haptic("tap");
                onLanguage(name);
              }}
              className={`tap-target flex-1 shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${
                language === name
                  ? "bg-gradient-brand text-white"
                  : "text-slate-300"
              }`}
            >
              {languageNames[name]}
            </button>
          ))}
        </div>
        {language !== "javascript" && (
          <p className="text-xs text-slate-400">
            {t.codeFirstRun(languageNames[language])}
          </p>
        )}
        {/* Remount per language (and app language) so each keeps its own code */}
        <LazyCodeRunner
          key={`${language}-${locale}`}
          starter={starters(locale)[language]}
          language={language}
          storageId={`tg-sandbox-${language}`}
          minHeight="220px"
          keys={{ list: sandboxKeys(language), label: t.codeKeys }}
        />
        <p className="text-xs text-slate-400">{t.codeSaved}</p>
      </section>
    </NextIntlClientProvider>
  );
}
