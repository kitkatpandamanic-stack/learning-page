"use client";

import { useEffect, useState } from "react";

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
import { callApi, haptic, webApp } from "@/components/tg/telegram";
import type { MiniAppHome } from "@/lib/tg-app/home";
import { appTexts, languageNames } from "@/lib/tg-app/texts";

const DUEL_SECONDS = 30;

type Info = {
  id: string;
  language: string;
  challenger: string;
  yours: boolean;
  toBeat: { score: number; ms: number } | null;
  played: boolean;
  expired: boolean;
  size: number;
};

type Result = {
  id: string;
  language: string;
  challenger: string;
  yours: boolean;
  score: number;
  size: number;
  ms: number;
  grid: boolean[];
  review: Reviewed[];
  outcome: "won" | "lost" | null;
  toBeat: { score: number; ms: number } | null;
  ranking: {
    name: string;
    score: number;
    ms: number;
    you: boolean;
    challenger: boolean;
  }[];
  xp: number;
};

type Recent = {
  id: string;
  language: string;
  challenger: string;
  yours: boolean;
  score: number | null;
  players: number;
}[];

/** A new challenge in a language: its id, or why not. */
export async function startChallenge(
  language: string,
): Promise<{ id: string } | { error: "duelLimit" | "failed" }> {
  haptic("tap");
  try {
    const created = await callApi<{ id?: string; limit?: true }>("duel", {
      action: "create",
      language,
    });
    return created.id ? { id: created.id } : { error: "duelLimit" };
  } catch {
    return { error: "failed" };
  }
}

/**
 * Duels: start a challenge (play it, then send it to a chat), or answer one
 * someone sent (t.me/<bot>?startapp=duel_<id>).
 */
export function DuelTab({
  home,
  duel,
  onDuel,
  notice,
}: {
  home: MiniAppHome;
  /** The duel being looked at or played, if any */
  duel: string | null;
  onDuel: (duel: string | null) => void;
  /** Why a challenge couldn't start (from the Blitz's or the bot's buttons) */
  notice: string | null;
}) {
  const t = appTexts[home.locale];
  const [message, setMessage] = useState<string | null>(notice);
  const [recent, setRecent] = useState<Recent>([]);

  useEffect(() => {
    if (duel) return;
    let cancelled = false;
    callApi<Recent>("duel", { action: "recent" })
      .then((rows) => {
        if (!cancelled) setRecent(rows);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [duel]);

  // Telegram's back button returns to the duel list.
  useEffect(() => {
    const back = webApp()?.BackButton;
    if (!back || !duel) return;
    const leave = () => onDuel(null);
    back.show();
    back.onClick(leave);
    return () => {
      back.offClick(leave);
      back.hide();
    };
  }, [duel, onDuel]);

  async function create(language: string) {
    const created = await startChallenge(language);
    if ("id" in created) onDuel(created.id);
    else setMessage(appTexts[home.locale][created.error]);
  }

  if (duel)
    return (
      <DuelView
        key={duel}
        id={duel}
        home={home}
        onNew={(language) => void create(language)}
      />
    );

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-white">⚔️ {t.duelTitle}</h1>
      <p className="text-slate-300">{t.duelIntro}</p>
      <p className="text-sm text-amber-200">
        {home.linked ? t.duelXp : t.duelGuest}
      </p>
      {message && <p className="text-sm text-red-300">{message}</p>}
      <p className="font-semibold text-white">{t.pickLanguage}</p>
      <div className="grid grid-cols-2 gap-2">
        {Object.keys(languageNames).map((language) => (
          <button
            key={language}
            type="button"
            onClick={() => void create(language)}
            className="tap-target rounded-2xl bg-gradient-brand px-4 py-4 font-semibold text-white"
          >
            {languageNames[language]}
          </button>
        ))}
      </div>
      {recent.length > 0 && (
        <div className="rounded-2xl p-4 glass">
          <h2 className="mb-2 font-semibold text-white">{t.recentDuels}</h2>
          <ul className="grid gap-1 text-sm">
            {recent.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onDuel(r.id)}
                  className="tap-target flex w-full justify-between rounded-lg px-2 py-2 text-left text-slate-200 hover:bg-white/5"
                >
                  <span>
                    {r.yours
                      ? t.yourDuel(languageNames[r.language])
                      : t.challengedBy(r.challenger, languageNames[r.language])}
                  </span>
                  <span className="shrink-0 pl-2 whitespace-nowrap text-slate-400">
                    {r.score === null
                      ? t.notFinished
                      : `${r.score}/5 · ${t.players(r.players)}`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** One duel: the invitation, the round, then the result. */
function DuelView({
  id,
  home,
  onNew,
}: {
  id: string;
  home: MiniAppHome;
  onNew: (language: string) => void;
}) {
  const t = appTexts[home.locale];
  const [info, setInfo] = useState<Info | null | "failed">(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    callApi<Info>("duel", { action: "info", duel: id })
      .then((found) => {
        if (!cancelled) setInfo(found);
      })
      .catch(() => {
        if (!cancelled) setInfo("failed");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (info === null)
    return <p className="m-auto animate-pulse text-slate-300">{t.loading}</p>;
  if (info === "failed")
    return <p className="m-auto text-center text-slate-300">{t.duelMissing}</p>;

  // Your own challenge, or one you've played: straight to the round/result.
  if (playing || info.yours || info.played)
    return (
      <Round<Result>
        api="duel"
        target={{ duel: id }}
        seconds={DUEL_SECONDS}
        locale={home.locale}
        language={info.language}
        result={(result) => (
          <DuelResult result={result} home={home} onNew={onNew} />
        )}
      />
    );

  const language = languageNames[info.language];
  return (
    <section className="flex flex-col items-center gap-4 pt-6 text-center">
      <p className="text-5xl">⚔️</p>
      <h1 className="text-2xl font-bold text-white">
        {t.challengedBy(info.challenger, language)}
      </h1>
      {info.expired ? (
        <p className="text-slate-300">{t.duelEnded}</p>
      ) : !info.toBeat ? (
        <p className="text-slate-300">{t.duelNotReady}</p>
      ) : (
        <>
          <p className="text-amber-200">
            {t.toBeat(info.toBeat.score, info.size, info.toBeat.ms)}
          </p>
          <p className="text-sm text-slate-400">
            {home.linked ? t.duelXp : t.duelGuest}
          </p>
          <button
            type="button"
            onClick={() => {
              haptic("tap");
              setPlaying(true);
            }}
            className="tap-target rounded-full bg-gradient-brand px-8 py-3 font-semibold text-white"
          >
            {t.accept}
          </button>
        </>
      )}
      {(info.expired || !info.toBeat) && (
        <button
          type="button"
          onClick={() => onNew(info.language)}
          className="tap-target rounded-full px-6 py-3 font-semibold text-white glass"
        >
          {t.challenge}
        </button>
      )}
    </section>
  );
}

function DuelResult({
  result,
  home,
  onNew,
}: {
  result: Result;
  home: MiniAppHome;
  onNew: (language: string) => void;
}) {
  const t = appTexts[home.locale];
  const language = languageNames[result.language];
  const body = { kind: "duel", duel: result.id };
  const headline = result.yours
    ? t.yourDuel(language)
    : result.outcome === "won"
      ? t.won
      : result.outcome === "lost"
        ? t.lost
        : t.challengedBy(result.challenger, language);
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 rounded-3xl p-5 text-center glass">
        <p className="text-sm text-cyan-200">⚔️ {headline}</p>
        <p className="text-6xl font-bold text-white">
          {t.result(result.score, result.size)}
        </p>
        <p className="text-amber-200">⚡ {t.seconds(result.ms)}</p>
        {result.toBeat && (
          <p className="text-sm text-slate-300">
            {t.toBeat(result.toBeat.score, result.size, result.toBeat.ms)}
          </p>
        )}
        {result.xp > 0 && (
          <p className="font-semibold text-emerald-300">
            {t.xpEarned(result.xp)}
          </p>
        )}
        <p className="font-mono text-xl tracking-widest">
          {grid(result.grid, result.size)}
        </p>
      </div>

      {result.yours ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void shareToChat(body)}
            className="tap-target flex-1 rounded-full bg-gradient-brand px-4 py-3 font-semibold text-white"
          >
            {t.sendChallenge}
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
      ) : (
        <button
          type="button"
          onClick={() => onNew(result.language)}
          className="tap-target rounded-full bg-gradient-brand px-4 py-3 font-semibold text-white"
        >
          {t.challenge}
        </button>
      )}

      <div className="rounded-2xl p-4 glass">
        <h2 className="mb-2 font-semibold text-white">{t.duelRanking}</h2>
        <ol className="grid gap-1 text-sm">
          {result.ranking.map((row, i) => (
            <li
              key={i}
              className={`flex justify-between rounded-lg px-2 py-1 ${row.you ? "bg-violet-500/25 text-white" : "text-slate-300"}`}
            >
              <span>
                {["🥇", "🥈", "🥉"][i] ?? `${i + 1}.`} {row.name}
                {row.challenger ? ` ⚔️ ${t.challengerMark}` : ""}
                {row.you ? ` (${t.you})` : ""}
              </span>
              <span className="tabular-nums">
                {row.score}/{result.size} · {t.seconds(row.ms)}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <AnswerReview review={result.review} locale={home.locale} />
    </section>
  );
}
