"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  canShareStory,
  shareToChat,
  shareToStory,
} from "@/components/tg/share";
import { callApi, haptic } from "@/components/tg/telegram";
import type { MiniAppHome } from "@/lib/tg-app/home";
import { appTexts, languageNames } from "@/lib/tg-app/texts";

const SECONDS = 60;
/** How far a card must be dragged to count as a swipe. */
const SWIPE_PX = 80;

type Overview = {
  xpLeft: boolean;
  languages: {
    language: string;
    cards: number;
    today: number | null;
    best: number | null;
  }[];
};
type Started = {
  id: string;
  language: string;
  cards: { code: string }[];
  left: number;
};
type Answered =
  | { counted: true; correct: boolean; works: boolean; done: boolean }
  | { counted: false; done: true };
type Result = {
  id: string;
  language: string;
  score: number;
  answered: number;
  review: {
    code: string;
    works: boolean;
    answer: boolean;
    explanation: string;
  }[];
  xp: number;
  best: number;
  rank: number;
  top: { score: number; name: string | null; you: boolean }[];
};

/** Bug Hunt: works or has a bug? As many cards as you can in 60 seconds. */
export function BugHuntTab({ home }: { home: MiniAppHome }) {
  const t = appTexts[home.locale];
  const [overview, setOverview] = useState<Overview | null>(null);
  const [language, setLanguage] = useState("python");
  const [phase, setPhase] = useState<
    "intro" | "playing" | "timeup" | "result" | "failed"
  >("intro");
  const [round, setRound] = useState<Started | null>(null);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const busy = useRef(false);
  const dragFrom = useRef<number | null>(null);

  const loadOverview = useCallback(async () => {
    try {
      setOverview(await callApi<Overview>("bughunt", { action: "overview" }));
    } catch {
      setPhase("failed");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    callApi<Overview>("bughunt", { action: "overview" })
      .then((found) => {
        if (!cancelled) setOverview(found);
      })
      .catch(() => {
        if (!cancelled) setPhase("failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadResult = useCallback(
    async (id: string) => {
      // The server closes a timed-out round a few seconds after the end.
      for (let tries = 3; tries > 0; tries--) {
        try {
          setResult(
            await callApi<Result>("bughunt", { action: "result", round: id }),
          );
          setPhase("result");
          void loadOverview();
          return;
        } catch {
          if (tries > 1) await new Promise((r) => setTimeout(r, 2000));
        }
      }
      setPhase("failed");
    },
    [loadOverview],
  );

  async function start() {
    haptic("tap");
    setMessage(null);
    try {
      const started = await callApi<Started | { limit: true }>("bughunt", {
        action: "start",
        language,
      });
      if ("limit" in started) {
        setMessage(t.bugHuntLimit);
        return;
      }
      setRound(started);
      setIndex(0);
      setScore(0);
      setResult(null);
      setDeadline(Date.now() + started.left);
      setPhase("playing");
    } catch {
      setPhase("failed");
    }
  }

  // The clock; at zero, a moment for the server to close the round.
  useEffect(() => {
    if (phase !== "playing" || !round) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= deadline) {
        clearInterval(timer);
        haptic("error");
        setPhase("timeup");
        setTimeout(() => void loadResult(round.id), 3500);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [phase, deadline, round, loadResult]);

  const answer = useCallback(
    async (works: boolean) => {
      if (busy.current || !round || phase !== "playing") return;
      busy.current = true;
      setDrag(0);
      try {
        const res = await callApi<Answered>("bughunt", {
          action: "answer",
          round: round.id,
          index,
          works,
        });
        if (!res.counted) {
          await loadResult(round.id);
          return;
        }
        haptic(res.correct ? "success" : "error");
        if (res.correct) setScore((s) => s + 1);
        setFeedback(res.correct);
        await new Promise((r) => setTimeout(r, 300));
        setFeedback(null);
        if (res.done) {
          setPhase("timeup");
          await loadResult(round.id);
        } else setIndex((i) => i + 1);
      } catch {
        setPhase("failed");
      } finally {
        busy.current = false;
      }
    },
    [round, phase, index, loadResult],
  );

  // Arrow keys work too: → works, ← bug.
  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") void answer(true);
      if (event.key === "ArrowLeft") void answer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, answer]);

  if (phase === "failed")
    return <p className="m-auto text-center text-slate-300">{t.failed}</p>;
  if (!overview)
    return <p className="m-auto animate-pulse text-slate-300">{t.loading}</p>;
  if (phase === "timeup")
    return (
      <p className="m-auto text-3xl font-bold text-white">⏰ {t.timeUp}</p>
    );

  if (phase === "playing" && round) {
    const shown = round.cards[index];
    const left = Math.max(0, deadline - now);
    const lean = drag > 0 ? "works" : drag < 0 ? "bug" : null;
    return (
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm text-slate-300">
          <span>
            🐞 {languageNames[round.language]} · {t.bugHuntScore(score, index)}
          </span>
          <span className="font-mono text-white tabular-nums">
            {Math.ceil(left / 1000)}s
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-gradient-brand transition-[width] duration-100"
            style={{ width: `${(left / (SECONDS * 1000)) * 100}%` }}
          />
        </div>
        <div
          role="group"
          aria-label={t.swipeHint}
          onPointerDown={(e) => {
            dragFrom.current = e.clientX;
            setDragging(true);
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (dragFrom.current !== null)
              setDrag(e.clientX - dragFrom.current);
          }}
          onPointerUp={() => {
            const moved = drag;
            dragFrom.current = null;
            setDragging(false);
            if (Math.abs(moved) >= SWIPE_PX) void answer(moved > 0);
            else setDrag(0);
          }}
          onPointerCancel={() => {
            dragFrom.current = null;
            setDragging(false);
            setDrag(0);
          }}
          className={`touch-pan-y rounded-2xl border-2 p-4 select-none ${
            feedback === true
              ? "border-emerald-400 bg-emerald-500/15"
              : feedback === false
                ? "border-red-400 bg-red-500/15"
                : lean === "works"
                  ? "border-emerald-400/60 bg-white/5"
                  : lean === "bug"
                    ? "border-red-400/60 bg-white/5"
                    : "border-white/15 bg-white/5"
          }`}
          style={{
            transform: `translateX(${drag}px) rotate(${drag / 30}deg)`,
            transition: dragging ? "none" : "transform 150ms",
          }}
        >
          <pre className="overflow-x-auto font-mono text-[13px] leading-relaxed whitespace-pre text-slate-100">
            {shown.code}
          </pre>
        </div>
        <p className="text-center text-xs text-slate-400">{t.swipeHint}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void answer(false)}
            disabled={feedback !== null}
            className="tap-target flex-1 rounded-full bg-red-500/80 px-4 py-3 font-semibold text-white"
          >
            🐞 {t.hasBug}
          </button>
          <button
            type="button"
            onClick={() => void answer(true)}
            disabled={feedback !== null}
            className="tap-target flex-1 rounded-full bg-emerald-500/80 px-4 py-3 font-semibold text-white"
          >
            ✅ {t.works}
          </button>
        </div>
      </section>
    );
  }

  const mine = overview.languages.find((l) => l.language === language);
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-white">🐞 {t.bugHuntTitle}</h1>

      {phase === "result" && result && (
        <BugHuntResult
          result={result}
          home={home}
          isRecord={result.score > result.best}
        />
      )}

      <div className="flex gap-2 overflow-x-auto">
        {overview.languages.map((l) => (
          <button
            key={l.language}
            type="button"
            onClick={() => setLanguage(l.language)}
            aria-pressed={l.language === language}
            className={`tap-target shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${
              l.language === language
                ? "bg-gradient-brand text-white"
                : "text-slate-300 glass"
            }`}
          >
            {languageNames[l.language]}
          </button>
        ))}
      </div>
      {phase !== "result" && (
        <p className="text-sm text-slate-300">{t.bugHuntRules}</p>
      )}
      <p className="text-sm text-slate-300">
        {t.bugHuntYourBest(mine?.today ?? null, mine?.best ?? null)}
      </p>
      <p className="text-xs text-amber-200">
        {!home.linked
          ? t.bugHuntGuest
          : overview.xpLeft
            ? t.bugHuntXp
            : t.bugHuntNoXp}
      </p>
      {message && <p className="text-sm text-red-300">{message}</p>}
      <button
        type="button"
        onClick={() => void start()}
        className="tap-target rounded-full bg-gradient-brand px-6 py-3 font-semibold text-white"
      >
        {phase === "result" ? t.playAgain : t.play}
      </button>

      {phase === "result" && result && (
        <details className="rounded-2xl p-4 glass">
          <summary className="cursor-pointer font-semibold text-white">
            {t.review}
          </summary>
          <ol className="mt-3 grid gap-4 text-sm">
            {result.review.map((c, i) => (
              <li key={i} className="grid gap-1">
                <pre className="overflow-x-auto rounded-lg bg-black/30 p-2 font-mono text-xs whitespace-pre text-slate-100">
                  {c.code}
                </pre>
                <p
                  className={
                    c.answer === c.works ? "text-emerald-300" : "text-red-300"
                  }
                >
                  {c.works ? `✅ ${t.verdictWorks}` : `🐞 ${t.verdictBug}`} ·{" "}
                  {t.youSaid(c.answer)}
                </p>
                <p className="text-slate-400">{c.explanation}</p>
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}

function BugHuntResult({
  result,
  home,
  isRecord,
}: {
  result: Result;
  home: MiniAppHome;
  isRecord: boolean;
}) {
  const t = appTexts[home.locale];
  const body = { kind: "bughunt", round: result.id };
  return (
    <>
      <div className="flex flex-col items-center gap-2 rounded-3xl p-5 text-center glass">
        <p className="text-sm text-cyan-200">
          {t.bugHuntTitle} · {languageNames[result.language]}
        </p>
        <p className="text-6xl font-bold text-white">
          {result.score}/{result.answered}
        </p>
        <p className="text-amber-200">
          {t.bugHuntScore(result.score, result.answered)} ·{" "}
          {t.bugHuntPlace(result.rank)}
        </p>
        {isRecord && (
          <p className="font-semibold text-white">{t.bugHuntRecord}</p>
        )}
        {result.xp > 0 && (
          <p className="font-semibold text-emerald-300">
            {t.xpEarned(result.xp)}
          </p>
        )}
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
              <span className="tabular-nums">{row.score}</span>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
