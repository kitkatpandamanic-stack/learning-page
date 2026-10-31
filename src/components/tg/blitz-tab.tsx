"use client";

import { useCallback } from "react";

import {
  AnswerReview,
  grid,
  Round,
  type Reviewed,
} from "@/components/tg/round";
import {
  canShareStory,
  shareToChat,
  shareToStory,
} from "@/components/tg/share";
import { haptic, useBackButton } from "@/components/tg/telegram";
import type { MiniAppHome } from "@/lib/tg-app/home";
import { appTexts, languageNames } from "@/lib/tg-app/texts";

type Result = {
  number: number;
  language: string;
  score: number;
  size: number;
  ms: number;
  grid: boolean[];
  review: Reviewed[];
  rank: number;
  total: number;
  top: { score: number; ms: number; name: string | null; you: boolean }[];
  xp: number;
};

export function BlitzTab({
  home,
  language,
  onLanguage,
  onChange,
  onChallenge,
}: {
  home: MiniAppHome;
  language: string | null;
  onLanguage: (language: string | null) => void;
  onChange: () => void;
  /** "Challenge a friend" under a result: a duel in that language */
  onChallenge: (language: string) => void;
}) {
  const t = appTexts[home.locale];

  // Telegram's back button leaves a game for the list.
  const leave = useCallback(() => {
    onLanguage(null);
    onChange();
  }, [onLanguage, onChange]);
  useBackButton(language ? leave : null);

  if (language)
    return (
      <Round<Result>
        key={language}
        api="blitz"
        target={{ language }}
        seconds={60}
        locale={home.locale}
        language={language}
        result={(result) => (
          <BlitzResult
            result={result}
            home={home}
            onChallenge={() => onChallenge(result.language)}
          />
        )}
      />
    );

  const xpNote = !home.linked
    ? t.blitzGuest
    : home.blitz.xpLeft
      ? t.blitzXp
      : t.blitzNoXp;
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-white">
        ⚡ {t.blitzTitle(home.blitz.number)}
      </h1>
      <p className="text-slate-300">{t.blitzIntro}</p>
      <p className="text-sm text-amber-200">{xpNote}</p>
      <ul className="grid gap-2">
        {home.blitz.languages.map((l) => (
          <li key={l.language}>
            <button
              type="button"
              onClick={() => {
                haptic("tap");
                onLanguage(l.language);
              }}
              className="tap-target flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left glass"
            >
              <span className="font-semibold text-white">
                {languageNames[l.language]}
              </span>
              <span
                className={
                  l.status === "done"
                    ? "text-sm text-emerald-300"
                    : "rounded-full bg-gradient-brand px-4 py-1.5 text-sm font-semibold text-white"
                }
              >
                {l.status === "done"
                  ? `${t.doneToday(l.score ?? 0)} · ${t.seeResult}`
                  : l.status === "playing"
                    ? t.resume
                    : t.play}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function BlitzResult({
  result,
  home,
  onChallenge,
}: {
  result: Result;
  home: MiniAppHome;
  onChallenge: () => void;
}) {
  const t = appTexts[home.locale];
  const body = { kind: "blitz", language: result.language };
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 rounded-3xl p-5 text-center glass">
        <p className="text-sm text-cyan-200">
          {t.blitzTitle(result.number)} · {languageNames[result.language]}
        </p>
        <p className="text-6xl font-bold text-white">
          {t.result(result.score, result.size)}
        </p>
        <p className="text-amber-200">
          ⚡ {t.seconds(result.ms)} · {t.place(result.rank, result.total)}
        </p>
        {result.xp > 0 && (
          <p className="font-semibold text-emerald-300">
            {t.xpEarned(result.xp)}
          </p>
        )}
        <p className="font-mono text-xl tracking-widest">
          {grid(result.grid, result.size)}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void shareToChat(body)}
          className="tap-target flex-1 rounded-full bg-gradient-brand px-4 py-3 font-semibold text-white"
        >
          {t.shareChat}
        </button>
        {canShareStory() && (
          <button
            type="button"
            onClick={() => void shareToStory(body)}
            className="tap-target rounded-full px-4 py-3 font-semibold text-white glass"
          >
            {t.shareStory}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onChallenge}
        className="tap-target rounded-full px-4 py-3 font-semibold text-white glass"
      >
        {t.challenge}
      </button>

      <div className="rounded-2xl p-4 glass">
        <h2 className="mb-2 font-semibold text-white">{t.topToday}</h2>
        <ol className="grid gap-1 text-sm">
          {result.top.map((row, i) => (
            <li
              key={i}
              className={`flex justify-between rounded-lg px-2 py-1 ${row.you ? "bg-violet-500/25 text-white" : "text-slate-300"}`}
            >
              <span>
                {["🥇", "🥈", "🥉"][i] ?? `${i + 1}.`}{" "}
                {row.name ?? `🐼 ${t.anonymous}`}
                {row.you ? ` (${t.you})` : ""}
              </span>
              <span className="tabular-nums">
                {row.score}/10 · {t.seconds(row.ms)}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <AnswerReview review={result.review} locale={home.locale} />
      <p className="text-center text-sm text-slate-400">{t.comeBack}</p>
    </section>
  );
}
