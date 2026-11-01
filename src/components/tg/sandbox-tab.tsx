"use client";

import { NextIntlClientProvider, useMessages } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { LazyCodeRunner } from "@/components/code/lazy-code-runner";
import { starters } from "@/components/code/playground";
import { shareToChat } from "@/components/tg/share";
import { callApi, haptic, webApp } from "@/components/tg/telegram";
import type { OutputLine } from "@/lib/runner/execute";
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

/** Code from a ▶ Run link (the bot's /run, or a shared run). */
type Snippet = {
  id: string;
  /** Empty if nobody picked one */
  language: string;
  code: string;
  author: string;
  yours: boolean;
};

const isSandboxLanguage = (value: string): value is SandboxLanguage =>
  (sandboxLanguages as readonly string[]).includes(value);

/**
 * The Code tab: the site's playground for Python, JavaScript, SQL and
 * TypeScript, with a row of keys the phone keyboard hides. Code runs on the
 * device and is saved there, per language. A ▶ Run link opens someone's
 * code instead (not saved, never run until the learner taps Run); any run
 * can be shared to a chat with what it printed.
 */
export function SandboxTab({
  locale,
  language,
  onLanguage,
  snippet: snippetId,
  onCloseSnippet,
}: {
  locale: AppLocale;
  language: SandboxLanguage;
  onLanguage: (language: SandboxLanguage) => void;
  /** A ▶ Run link's code to open, by id */
  snippet: string | null;
  onCloseSnippet: () => void;
}) {
  const t = appTexts[locale];
  const messages = useMessages();
  /** The snippet fetched for a ▶ Run link, by its id (null: not found) */
  const [fetched, setFetched] = useState<{
    id: string;
    snippet: Snippet | null;
  } | null>(null);
  /** The last run and any notice, for the editor showing when they happened */
  const [lastRun, setLastRun] = useState<{
    editor: string;
    code: string;
    output: string[];
  } | null>(null);
  const [notice, setNotice] = useState<{ editor: string; text: string } | null>(
    null,
  );
  const [sharing, setSharing] = useState(false);

  // Swiping down in the editor scrolls the code instead of closing the app.
  useEffect(() => {
    const tg = webApp();
    if (!tg?.isVersionAtLeast("7.7")) return;
    tg.disableVerticalSwipes?.();
    return () => tg.enableVerticalSwipes?.();
  }, []);

  useEffect(() => {
    if (!snippetId) return;
    let live = true;
    callApi<Snippet | null>("snippet", { action: "get", id: snippetId })
      .catch(() => null)
      .then((found) => {
        if (live) setFetched({ id: snippetId, snippet: found });
      });
    return () => {
      live = false;
    };
  }, [snippetId]);

  const snippet: Snippet | null | "loading" = !snippetId
    ? null
    : fetched?.id === snippetId
      ? fetched.snippet
      : "loading";
  const opened = snippet && snippet !== "loading" ? snippet : null;
  const current: SandboxLanguage =
    opened && isSandboxLanguage(opened.language) ? opened.language : language;
  // A run belongs to the editor it happened in; another editor starts empty.
  const editor = opened ? `snippet-${opened.id}` : `${language}-${locale}`;
  const run = lastRun?.editor === editor ? lastRun : null;
  const shareNotice = notice?.editor === editor ? notice.text : null;

  const onResult = useCallback(
    (code: string, output: OutputLine[]) => {
      setLastRun({
        editor,
        code,
        output: output.filter((line) => !line.image).map((line) => line.text),
      });
      setNotice(null);
    },
    [editor],
  );

  async function share() {
    if (!run || sharing) return;
    setSharing(true);
    try {
      await shareToChat(
        {
          action: "share",
          language: current,
          code: run.code,
          output: run.output,
          from: opened?.id,
        },
        "snippet",
      );
    } catch {
      setNotice({ editor, text: t.codeShareFailed });
    } finally {
      setSharing(false);
    }
  }

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
        {snippetId ? (
          <div className="flex flex-col gap-2 rounded-2xl p-4 glass">
            {snippet === "loading" && (
              <p className="animate-pulse text-slate-300">{t.codeLoading}</p>
            )}
            {snippet === null && (
              <p className="text-slate-200">{t.codeMissing}</p>
            )}
            {opened && (
              <>
                <p className="font-semibold text-white">
                  {opened.yours ? t.codeFromYou : t.codeFrom(opened.author)}
                </p>
                <p className="text-sm text-slate-300">{t.codeCaution}</p>
              </>
            )}
            <button
              type="button"
              onClick={onCloseSnippet}
              className="self-start text-sm font-semibold text-cyan-200"
            >
              {t.codeBack}
            </button>
          </div>
        ) : (
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
        )}
        {(!snippetId || opened) && (
          <>
            {current !== "javascript" && (
              <p className="text-xs text-slate-400">
                {t.codeFirstRun(languageNames[current])}
              </p>
            )}
            {/* Remount per language, app language and snippet: each keeps its own code */}
            <LazyCodeRunner
              key={editor}
              starter={opened ? opened.code : starters(locale)[current]}
              language={current}
              // Someone else's code isn't saved over the learner's own.
              storageId={opened ? undefined : `tg-sandbox-${current}`}
              minHeight="220px"
              keys={{ list: sandboxKeys(current), label: t.codeKeys }}
              onResult={onResult}
            />
            <button
              type="button"
              onClick={() => void share()}
              disabled={!run || sharing}
              className="tap-target rounded-full px-4 py-3 font-semibold text-white glass disabled:opacity-50"
            >
              {t.codeShare}
            </button>
            <p className="text-xs text-slate-400">
              {shareNotice ??
                (!run ? t.codeShareHint : opened ? null : t.codeSaved)}
            </p>
          </>
        )}
      </section>
    </NextIntlClientProvider>
  );
}
