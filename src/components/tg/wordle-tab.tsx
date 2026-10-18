"use client";

import { useCallback, useEffect, useState } from "react";

import {
  canShareStory,
  shareToChat,
  shareToStory,
} from "@/components/tg/share";
import { callApi, haptic } from "@/components/tg/telegram";
import type { MiniAppHome } from "@/lib/tg-app/home";
import { appTexts, languageNames } from "@/lib/tg-app/texts";

type Mark = "g" | "y" | "x";
type Game = {
  number: number;
  language: string;
  length: number;
  tries: number;
  rows: { word: string; marks: Mark[] }[];
  solved: boolean;
  done: boolean;
  hint: string | null;
  answer: string | null;
  xp: number;
};
type Overview = {
  language: string;
  status: "new" | "playing" | "solved" | "failed";
  tries: number;
}[];

const KEYS = ["qwertyuiop", "asdfghjkl", "+zxcvbnm-"];
const tile: Record<Mark | "", string> = {
  g: "bg-emerald-500 text-white border-emerald-500",
  y: "bg-amber-500 text-white border-amber-500",
  x: "bg-slate-800 text-slate-400 border-slate-800",
  "": "border-white/25 text-white",
};

/** Code Wordle: the day's code word in each language, six tries. */
export function WordleTab({
  home,
  language: asked,
}: {
  home: MiniAppHome;
  /** From t.me/<bot>?startapp=wordle_python */
  language: string | null;
}) {
  const t = appTexts[home.locale];
  const [overview, setOverview] = useState<Overview | null>(null);
  const [language, setLanguage] = useState<string | null>(asked);
  const [game, setGame] = useState<Game | null>(null);
  const [typed, setTyped] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    callApi<Overview>("wordle", { action: "overview" })
      .then((rows) => {
        if (cancelled) return;
        setOverview(rows);
        // Start on the first language not played yet today.
        setLanguage(
          (current) =>
            current ??
            rows.find((r) => r.status === "new" || r.status === "playing")
              ?.language ??
            rows[0].language,
        );
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!language) return;
    let cancelled = false;
    callApi<Game>("wordle", { action: "today", language })
      .then((found) => {
        if (cancelled) return;
        setGame(found);
        setTyped("");
        setMessage(null);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [language]);

  const press = useCallback(
    async (key: string) => {
      if (!game || game.done || busy) return;
      if (key === "-") {
        setTyped((s) => s.slice(0, -1));
        return;
      }
      if (key !== "+") {
        if (typed.length < game.length && /^[a-z]$/.test(key)) {
          haptic("tap");
          setTyped((s) => s + key);
        }
        return;
      }
      if (typed.length !== game.length) {
        haptic("error");
        setMessage(t.wordleTooShort(game.length));
        return;
      }
      setBusy(true);
      try {
        const next = await callApi<Game>("wordle", {
          action: "guess",
          language: game.language,
          guess: typed,
        });
        haptic(next.solved ? "success" : next.done ? "error" : "tap");
        setGame(next);
        setTyped("");
        setMessage(null);
        setOverview(
          (rows) =>
            rows?.map((r) =>
              r.language === next.language
                ? {
                    ...r,
                    tries: next.rows.length,
                    status: next.solved
                      ? "solved"
                      : next.done
                        ? "failed"
                        : "playing",
                  }
                : r,
            ) ?? rows,
        );
      } catch {
        setMessage(t.failed);
      } finally {
        setBusy(false);
      }
    },
    [game, busy, typed, t],
  );

  // A real keyboard works too.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key =
        event.key === "Enter"
          ? "+"
          : event.key === "Backspace"
            ? "-"
            : event.key.toLowerCase();
      if (key === "+" || key === "-" || /^[a-z]$/.test(key)) void press(key);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  if (failed)
    return <p className="m-auto text-center text-slate-300">{t.failed}</p>;
  if (!overview || !game)
    return <p className="m-auto animate-pulse text-slate-300">{t.loading}</p>;

  // The best colour each letter has earned, for the keyboard.
  const keyMarks = new Map<string, Mark>();
  const rank = { g: 3, y: 2, x: 1 };
  for (const row of game.rows)
    [...row.word].forEach((letter, i) => {
      const mark = row.marks[i];
      const had = keyMarks.get(letter);
      if (!had || rank[mark] > rank[had]) keyMarks.set(letter, mark);
    });

  const rows = Array.from({ length: game.tries }, (_, r) => {
    const done = game.rows[r];
    if (done) return { letters: [...done.word], marks: done.marks };
    if (r === game.rows.length && !game.done)
      return { letters: [...typed], marks: [] as Mark[] };
    return { letters: [] as string[], marks: [] as Mark[] };
  });
  const body = { kind: "wordle", language: game.language };

  return (
    <section className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold text-white">
        🔤 {t.wordleTitle(game.number)}
      </h1>
      <div className="flex gap-2 overflow-x-auto">
        {overview.map((o) => (
          <button
            key={o.language}
            type="button"
            onClick={() => setLanguage(o.language)}
            aria-pressed={o.language === game.language}
            className={`tap-target shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${
              o.language === game.language
                ? "bg-gradient-brand text-white"
                : "text-slate-300 glass"
            }`}
          >
            {languageNames[o.language]}
            {o.status === "solved" ? " ✓" : o.status === "failed" ? " ✗" : ""}
          </button>
        ))}
      </div>
      {game.rows.length === 0 && (
        <p className="text-sm text-slate-300">{t.wordleIntro(game.length)}</p>
      )}

      <div
        className="mx-auto grid gap-1.5"
        style={{
          gridTemplateColumns: `repeat(${game.length}, minmax(0, 1fr))`,
        }}
        aria-label={t.wordleTitle(game.number)}
      >
        {rows.flatMap((row, r) =>
          Array.from({ length: game.length }, (_, i) => (
            <div
              key={`${r}-${i}`}
              className={`flex aspect-square items-center justify-center rounded-lg border-2 font-mono text-xl font-bold uppercase ${tile[row.marks[i] ?? ""]}`}
              // Up to 10 letters must fit a phone's width.
              style={{
                width: `min(2.75rem, calc((100vw - 2rem - ${(game.length - 1) * 6}px) / ${game.length}))`,
              }}
            >
              {row.letters[i] ?? ""}
            </div>
          )),
        )}
      </div>

      <div className="rounded-2xl px-3 py-2 text-sm glass">
        {game.hint ? (
          <p className="text-slate-200">
            <span className="font-semibold text-cyan-200">
              💡 {t.wordleHint}:
            </span>{" "}
            {game.hint}
          </p>
        ) : (
          <p className="text-slate-400">{t.wordleHintLater}</p>
        )}
      </div>

      {message && <p className="text-center text-sm text-red-300">{message}</p>}

      {game.done ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl p-4 text-center glass">
          <p className="text-lg font-bold text-white">
            {game.solved ? t.wordleSolved(game.rows.length) : t.wordleFailed}
          </p>
          {!game.solved && (
            <p className="font-mono text-2xl font-bold tracking-widest text-amber-200 uppercase">
              {game.answer}
            </p>
          )}
          {game.xp > 0 && (
            <p className="font-semibold text-emerald-300">
              {t.xpEarned(game.xp)}
            </p>
          )}
          <div className="flex w-full gap-2">
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
          <p className="text-sm text-slate-400">{t.wordleComeBack}</p>
        </div>
      ) : (
        <>
          <p className="text-center text-xs text-amber-200">
            {home.linked ? t.wordleXp : t.wordleGuest}
          </p>
          <div className="flex flex-col gap-1.5">
            {KEYS.map((row) => (
              <div key={row} className="flex justify-center gap-1">
                {[...row].map((key) => {
                  const mark = keyMarks.get(key);
                  const wide = key === "+" || key === "-";
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => void press(key)}
                      aria-label={
                        key === "+" ? t.enter : key === "-" ? "⌫" : key
                      }
                      className={`flex h-12 items-center justify-center rounded-md text-sm font-semibold uppercase ${
                        wide ? "px-2 text-xs" : "w-[8.5%]"
                      } ${mark ? tile[mark] : "bg-white/15 text-white"}`}
                    >
                      {key === "+" ? t.enter : key === "-" ? "⌫" : key}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
