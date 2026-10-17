"use client";

import { useCallback, useEffect, useState } from "react";

import { callApi, haptic, webApp } from "@/components/tg/telegram";
import type { MiniAppHome } from "@/lib/tg-app/home";
import { appTexts } from "@/lib/tg-app/texts";

type League = {
  chatId: number;
  title: string;
  week: string;
  table: { name: string; xp: number; linked: boolean; you: boolean }[];
};
type Invite = {
  chatId: number;
  title: string;
  members: number;
  joined: boolean;
};

/**
 * Group leagues: the weekly tables of the groups you joined, and the join
 * card when the app was opened from a group's /league button.
 */
export function LeagueTab({
  home,
  invite: param,
}: {
  home: MiniAppHome;
  /** g_<chat id>_<signature> from the group's button, if opened from one */
  invite: string | null;
}) {
  const t = appTexts[home.locale];
  const [leagues, setLeagues] = useState<League[] | null>(null);
  const [invite, setInvite] = useState<Invite | null | "missing">(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const [mine, found] = await Promise.all([
        callApi<League[]>("league", { action: "mine" }),
        param
          ? callApi<Invite>("league", { action: "invite", group: param }).catch(
              () => "missing" as const,
            )
          : Promise.resolve(null),
      ]);
      setLeagues(mine);
      setInvite(found);
    } catch {
      setFailed(true);
    }
  }, [param]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function join() {
    haptic("tap");
    await callApi("league", { action: "join", group: param });
    haptic("success");
    await load();
  }

  async function leave(chatId: number) {
    haptic("tap");
    await callApi("league", { action: "leave", chatId });
    await load();
  }

  if (failed)
    return <p className="m-auto text-center text-slate-300">{t.failed}</p>;
  if (!leagues)
    return <p className="m-auto animate-pulse text-slate-300">{t.loading}</p>;

  const addToGroup = `https://t.me/${home.bot}?startgroup=league`;
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-white">👥 {t.leagueTitle}</h1>

      {invite === "missing" && (
        <p className="text-sm text-red-300">{t.leagueNotFound}</p>
      )}
      {invite && invite !== "missing" && !invite.joined && (
        <div className="flex flex-col items-center gap-3 rounded-3xl p-5 text-center glass">
          <h2 className="text-xl font-bold text-white">
            {t.joinLeague(invite.title)}
          </h2>
          <p className="text-sm text-slate-300">
            {t.leagueMembers(invite.members)}
          </p>
          <p className="text-sm text-slate-400">{t.leagueCounts}</p>
          {!home.linked && (
            <p className="text-sm text-amber-200">{t.leagueGuest}</p>
          )}
          <button
            type="button"
            onClick={() => void join()}
            className="tap-target rounded-full bg-gradient-brand px-8 py-3 font-semibold text-white"
          >
            {t.join}
          </button>
        </div>
      )}

      {leagues.length === 0 && (
        <div className="flex flex-col gap-3 rounded-2xl p-4 glass">
          <p className="text-slate-300">{t.leagueIntro}</p>
          <button
            type="button"
            onClick={() => webApp()?.openTelegramLink(addToGroup)}
            className="tap-target rounded-full bg-gradient-brand px-4 py-3 font-semibold text-white"
          >
            {t.addToGroup}
          </button>
        </div>
      )}

      {leagues.map((league) => (
        <div key={league.chatId} className="rounded-2xl p-4 glass">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h2 className="font-semibold text-white">{league.title}</h2>
            <span className="text-xs text-slate-400">{t.thisWeek}</span>
          </div>
          <ol className="grid gap-1 text-sm">
            {league.table.map((row, i) => (
              <li
                key={i}
                className={`flex justify-between gap-2 rounded-lg px-2 py-1 ${row.you ? "bg-violet-500/25 text-white" : "text-slate-300"}`}
              >
                <span>
                  {["🥇", "🥈", "🥉"][i] ?? `${i + 1}.`} {row.name}
                  {row.you ? ` (${t.you})` : ""}
                </span>
                <span className="shrink-0 tabular-nums">
                  {row.linked ? `${row.xp} XP` : t.noAccount}
                </span>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={() => void leave(league.chatId)}
            className="mt-3 text-xs text-slate-400 underline"
          >
            {t.leave}
          </button>
        </div>
      ))}

      {leagues.length > 0 && (
        <button
          type="button"
          onClick={() => webApp()?.openTelegramLink(addToGroup)}
          className="tap-target rounded-full px-4 py-3 text-sm font-semibold text-white glass"
        >
          {t.addToGroup}
        </button>
      )}
    </section>
  );
}
