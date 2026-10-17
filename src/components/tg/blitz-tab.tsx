"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  canShareStory,
  shareToChat,
  shareToStory,
} from "@/components/tg/share";
import { callApi, haptic, webApp } from "@/components/tg/telegram";
import type { MiniAppHome } from "@/lib/tg-app/home";
import { appTexts, blitzShareText, languageNames } from "@/lib/tg-app/texts";

type Started = {
  number: number;
  questions: { question: string; options: string[] }[];
  answered: number;
  left: number;
  done: boolean;
};
type Answered =
  | { counted: true; correct: boolean; answer: number; done: boolean }
  | { counted: false; done: true };
type Result = {
  number: number;
  language: string;
  score: number;
  size: number;
  ms: number;
  grid: boolean[];
  review: {
    question: string;
    options: string[];
    answer: number;
    choice: number | null;
    explanation: string | null;
  }[];
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
}: {
  home: MiniAppHome;
  language: string | null;
  onLanguage: (language: string | null) => void;
  onChange: () => void;
}) {
  const t = appTexts[home.locale];

  // Telegram's back button leaves a game for the list.
  useEffect(() => {
    const back = webApp()?.BackButton;
    if (!back || !language) return;
    const leave = () => {
      onLanguage(null);
      onChange();
    };
    back.show();
    back.onClick(leave);
    return () => {
      back.offClick(leave);
      back.hide();
    };
  }, [language, onLanguage, onChange]);

  if (language)
    return <BlitzGame key={language} language={language} home={home} />;

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

function BlitzGame({
  language,
  home,
}: {
  language: string;
  home: MiniAppHome;
}) {
  const t = appTexts[home.locale];
  const [phase, setPhase] = useState<
    "loading" | "playing" | "timeup" | "result" | "failed"
  >("loading");
  const [game, setGame] = useState<Started | null>(null);
  const [index, setIndex] = useState(0);
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [feedback, setFeedback] = useState<{
    choice: number;
    answer: number;
    correct: boolean;
  } | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const busy = useRef(false);

  const loadResult = useCallback(async () => {
    // The server closes a timed-out Blitz a few seconds after the end.
    for (let tries = 3; tries > 0; tries--) {
      try {
        setResult(
          await callApi<Result>("blitz", { action: "result", language }),
        );
        setPhase("result");
        return;
      } catch {
        if (tries > 1) await new Promise((r) => setTimeout(r, 2000));
      }
    }
    setPhase("failed");
  }, [language]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const started = await callApi<Started>("blitz", {
          action: "start",
          language,
        });
        if (cancelled) return;
        if (started.done) return void loadResult();
        setGame(started);
        setIndex(started.answered);
        setDeadline(Date.now() + started.left);
        setPhase("playing");
      } catch {
        if (!cancelled) setPhase("failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [language, loadResult]);

  // The clock; at zero, a moment for the server to close the Blitz.
  useEffect(() => {
    if (phase !== "playing") return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= deadline) {
        clearInterval(timer);
        haptic("error");
        setPhase("timeup");
        setTimeout(() => void loadResult(), 3500);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [phase, deadline, loadResult]);

  async function answer(choice: number) {
    if (busy.current || !game || phase !== "playing") return;
    busy.current = true;
    try {
      const res = await callApi<Answered>("blitz", {
        action: "answer",
        language,
        index,
        choice,
      });
      if (!res.counted) {
        await loadResult();
        return;
      }
      haptic(res.correct ? "success" : "error");
      setFeedback({ choice, answer: res.answer, correct: res.correct });
      await new Promise((r) => setTimeout(r, 450));
      setFeedback(null);
      if (res.done) {
        setPhase("loading");
        await loadResult();
      } else setIndex((i) => i + 1);
    } catch {
      setPhase("failed");
    } finally {
      busy.current = false;
    }
  }

  if (phase === "failed")
    return <p className="m-auto text-center text-slate-300">{t.failed}</p>;
  if (phase === "loading")
    return <p className="m-auto animate-pulse text-slate-300">{t.loading}</p>;
  if (phase === "timeup")
    return (
      <p className="m-auto text-3xl font-bold text-white">⏰ {t.timeUp}</p>
    );
  if (phase === "result" && result)
    return <BlitzResult result={result} home={home} />;
  if (!game) return null;

  const question = game.questions[index];
  const left = Math.max(0, deadline - now);
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm text-slate-300">
        <span>
          {languageNames[language]} ·{" "}
          {t.question(index + 1, game.questions.length)}
        </span>
        <span className="font-mono text-white tabular-nums">
          {Math.ceil(left / 1000)}s
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-gradient-brand transition-[width] duration-100"
          style={{ width: `${(left / 60_000) * 100}%` }}
        />
      </div>
      <h2 className="text-lg font-semibold whitespace-pre-wrap text-white">
        {question.question}
      </h2>
      <ul className="grid gap-2">
        {question.options.map((option, i) => {
          const state = !feedback
            ? "glass text-white"
            : i === feedback.answer
              ? "bg-emerald-500/30 text-white ring-2 ring-emerald-400"
              : i === feedback.choice
                ? "bg-red-500/30 text-white ring-2 ring-red-400"
                : "glass text-slate-400";
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => void answer(i)}
                disabled={Boolean(feedback)}
                className={`tap-target w-full rounded-2xl px-4 py-3 text-left font-mono text-sm ${state}`}
              >
                {option}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function BlitzResult({ result, home }: { result: Result; home: MiniAppHome }) {
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
          {blitzShareText(home.locale, result).split("\n")[1]}
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

      <details className="rounded-2xl p-4 glass">
        <summary className="cursor-pointer font-semibold text-white">
          {t.review}
        </summary>
        <ol className="mt-3 grid gap-3 text-sm">
          {result.review.map((q, i) => (
            <li key={i} className="grid gap-1">
              <p className="whitespace-pre-wrap text-white">
                {i + 1}. {q.question}
              </p>
              <p
                className={
                  q.choice === q.answer ? "text-emerald-300" : "text-red-300"
                }
              >
                {t.yourAnswer}:{" "}
                {q.choice === null ? t.noAnswer : q.options[q.choice]}
              </p>
              {q.choice !== q.answer && (
                <p className="text-emerald-300">
                  {t.rightAnswer}: {q.options[q.answer]}
                </p>
              )}
              {q.explanation && (
                <p className="text-slate-400">{q.explanation}</p>
              )}
            </li>
          ))}
        </ol>
      </details>
      <p className="text-center text-sm text-slate-400">{t.comeBack}</p>
    </section>
  );
}
