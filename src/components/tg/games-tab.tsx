"use client";

import { useEffect, useState } from "react";

import { callApi, haptic } from "@/components/tg/telegram";
import type { MiniAppHome } from "@/lib/tg-app/home";
import { appTexts } from "@/lib/tg-app/texts";

export type Game = "blitz" | "duel" | "wordle" | "bughunt";

type WordleOverview = { status: "new" | "playing" | "solved" | "failed" }[];
type BugHuntOverview = { languages: { today: number | null }[] };

/** The Games tab: every game as a big card with how today is going. */
export function GamesHub({
  home,
  onGame,
}: {
  home: MiniAppHome;
  onGame: (game: Game) => void;
}) {
  const t = appTexts[home.locale];
  const [wordle, setWordle] = useState<WordleOverview | null>(null);
  const [bughunt, setBughunt] = useState<BugHuntOverview | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Today's status is a bonus: the cards work without it.
    callApi<WordleOverview>("wordle", { action: "overview" })
      .then((rows) => !cancelled && setWordle(rows))
      .catch(() => {});
    callApi<BugHuntOverview>("bughunt", { action: "overview" })
      .then((rows) => !cancelled && setBughunt(rows))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const blitzDone = home.blitz.languages.filter(
    (l) => l.status === "done",
  ).length;
  const wordleSolved = wordle?.filter((w) => w.status === "solved").length;
  const bugBest = bughunt?.languages.reduce<number | null>(
    (best, l) =>
      l.today !== null && (best === null || l.today > best) ? l.today : best,
    null,
  );

  const games: {
    id: Game;
    icon: string;
    title: string;
    text: string;
    status: string;
  }[] = [
    {
      id: "blitz",
      icon: "⚡",
      title: t.blitzTitle(home.blitz.number),
      text: t.gameBlitz,
      status: blitzDone > 0 ? t.blitzToday(blitzDone) : t.newToday,
    },
    {
      id: "duel",
      icon: "⚔️",
      title: t.duelTitle,
      text: t.gameDuel,
      status: "",
    },
    {
      id: "wordle",
      icon: "🔤",
      title: t.tabs.wordle,
      text: t.gameWordle,
      status: wordleSolved ? t.wordleToday(wordleSolved) : t.newToday,
    },
    {
      id: "bughunt",
      icon: "🐞",
      title: t.bugHuntTitle,
      text: t.gameBugHunt,
      status:
        bugBest !== null && bugBest !== undefined ? t.bugHuntBest(bugBest) : "",
    },
  ];

  return (
    <section className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold text-white">🎮 {t.gamesTitle}</h1>
      {games.map((game) => (
        <button
          key={game.id}
          type="button"
          onClick={() => {
            haptic("tap");
            onGame(game.id);
          }}
          className="tap-target flex items-center gap-4 rounded-2xl p-4 text-left glass"
        >
          <span aria-hidden className="text-4xl">
            {game.icon}
          </span>
          <span className="flex flex-1 flex-col gap-1">
            <span className="font-semibold text-white">{game.title}</span>
            <span className="text-sm text-slate-300">{game.text}</span>
            {game.status && (
              <span className="text-xs font-semibold text-amber-200">
                {game.status}
              </span>
            )}
          </span>
        </button>
      ))}
    </section>
  );
}
