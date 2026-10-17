"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { callApi, haptic } from "@/components/tg/telegram";
import { appTexts, languageNames, type AppLocale } from "@/lib/tg-app/texts";

type Started = {
  questions: { question: string; options: string[] }[];
  answered: number;
  left: number;
  done: boolean;
};
type Answered =
  | { counted: true; correct: boolean; answer: number; done: boolean }
  | { counted: false; done: true };

export type Reviewed = {
  question: string;
  options: string[];
  answer: number;
  choice: number | null;
  explanation: string | null;
};

/**
 * A timed round of questions (the Blitz, a duel): the server sends the
 * questions without answers, grades each tap, and keeps the clock. When it
 * ends, `result` is drawn with what the server says about it.
 */
export function Round<R>({
  api,
  target,
  seconds,
  locale,
  language,
  result: renderResult,
}: {
  api: "blitz" | "duel";
  /** What the round is: { language } for the Blitz, { duel } for a duel */
  target: Record<string, string>;
  seconds: number;
  locale: AppLocale;
  language: string;
  result: (result: R) => ReactNode;
}) {
  const t = appTexts[locale];
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
  } | null>(null);
  const [result, setResult] = useState<R | null>(null);
  const busy = useRef(false);
  const key = JSON.stringify(target);

  const loadResult = useCallback(async () => {
    // The server closes a timed-out round a few seconds after the end.
    for (let tries = 3; tries > 0; tries--) {
      try {
        setResult(
          await callApi<R>(api, { action: "result", ...JSON.parse(key) }),
        );
        setPhase("result");
        return;
      } catch {
        if (tries > 1) await new Promise((r) => setTimeout(r, 2000));
      }
    }
    setPhase("failed");
  }, [api, key]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const started = await callApi<Started>(api, {
          action: "start",
          ...JSON.parse(key),
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
  }, [api, key, loadResult]);

  // The clock; at zero, a moment for the server to close the round.
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
      const res = await callApi<Answered>(api, {
        action: "answer",
        ...target,
        index,
        choice,
      });
      if (!res.counted) {
        await loadResult();
        return;
      }
      haptic(res.correct ? "success" : "error");
      setFeedback({ choice, answer: res.answer });
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
  if (phase === "result" && result) return renderResult(result);
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
          style={{ width: `${(left / (seconds * 1000)) * 100}%` }}
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

/** "🟩🟥🟩…": each answer of a round. */
export const grid = (answers: boolean[], size: number) =>
  Array.from({ length: size }, (_, i) =>
    answers[i] === true ? "🟩" : answers[i] === false ? "🟥" : "⬜",
  ).join("");

/** The questions again, with the right answers and explanations. */
export function AnswerReview({
  review,
  locale,
}: {
  review: Reviewed[];
  locale: AppLocale;
}) {
  const t = appTexts[locale];
  return (
    <details className="rounded-2xl p-4 glass">
      <summary className="cursor-pointer font-semibold text-white">
        {t.review}
      </summary>
      <ol className="mt-3 grid gap-3 text-sm">
        {review.map((q, i) => (
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
            {q.explanation && <p className="text-slate-400">{q.explanation}</p>}
          </li>
        ))}
      </ol>
    </details>
  );
}
