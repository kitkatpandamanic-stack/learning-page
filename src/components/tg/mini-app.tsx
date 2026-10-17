"use client";

import Script from "next/script";
import { useCallback, useState } from "react";

import { BlitzTab } from "@/components/tg/blitz-tab";
import { DuelTab, startChallenge } from "@/components/tg/duel-tab";
import { LeagueTab } from "@/components/tg/league-tab";
import { PandaTab } from "@/components/tg/panda-tab";
import { callApi, telegramScript, webApp } from "@/components/tg/telegram";
import type { MiniAppHome } from "@/lib/tg-app/home";
import { appTexts, type AppLocale } from "@/lib/tg-app/texts";

const SPACE = "#070814";

type Tab = "panda" | "blitz" | "duel" | "league";

/**
 * PandaDev inside Telegram: the learner's panda, the Daily Blitz and duels. Runs
 * only in Telegram (it needs the signed launch data); elsewhere it points
 * to the bot.
 */
export function MiniApp({ bot }: { bot: string }) {
  const [state, setState] = useState<
    "loading" | "outside" | "failed" | "ready"
  >("loading");
  const [home, setHome] = useState<MiniAppHome | null>(null);
  const [tab, setTab] = useState<Tab>("panda");
  const [blitzLanguage, setBlitzLanguage] = useState<string | null>(null);
  const [duel, setDuel] = useState<string | null>(null);
  const [duelNotice, setDuelNotice] = useState<string | null>(null);
  /** g_<chat id>_<signature>: opened from a group's /league button */
  const [leagueInvite, setLeagueInvite] = useState<string | null>(null);
  const [locale, setLocale] = useState<AppLocale>("en");

  const load = useCallback(async () => {
    try {
      setHome(await callApi<MiniAppHome>("home"));
      setState("ready");
    } catch {
      setState("failed");
    }
  }, []);

  /** "Challenge a friend" and the bot's Rematch: a new duel, opened to play. */
  const challenge = useCallback(async (language: string) => {
    const created = await startChallenge(language);
    setTab("duel");
    if ("id" in created) {
      setDuelNotice(null);
      setDuel(created.id);
    } else {
      setDuel(null);
      setDuelNotice(created.error);
    }
  }, []);

  const start = useCallback(() => {
    const tg = webApp();
    if (!tg?.initData) {
      setState("outside");
      return;
    }
    tg.ready();
    tg.expand();
    tg.setHeaderColor(SPACE);
    tg.setBackgroundColor(SPACE);
    if (tg.isVersionAtLeast("7.10")) tg.setBottomBarColor?.(SPACE);
    setLocale(
      tg.initDataUnsafe.user?.language_code?.startsWith("ru") ? "ru" : "en",
    );
    // t.me/<bot>?startapp=blitz_python opens that Blitz, duel_<id> a duel,
    // duelnew_python a new challenge (the bot's Rematch button).
    const param = tg.initDataUnsafe.start_param ?? "";
    const asked = /^blitz_([a-z]+)$/.exec(param);
    const opened = /^duel_([\w-]{6,16})$/.exec(param);
    const rematch = /^duelnew_([a-z]+)$/.exec(param);
    if (asked || param === "blitz") {
      setTab("blitz");
      setBlitzLanguage(asked?.[1] ?? null);
    } else if (opened) {
      setTab("duel");
      setDuel(opened[1]);
    } else if (rematch) void challenge(rematch[1]);
    else if (/^g_-?\d+_[\w-]+$/.test(param)) {
      setTab("league");
      setLeagueInvite(param);
    }
    void load();
  }, [load, challenge]);

  const appLocale = home?.locale ?? locale;
  const t = appTexts[appLocale];
  // Russian uses Onest, like the rest of the site's Russian pages.
  const font =
    appLocale === "ru"
      ? ({ "--font-ui": "var(--font-onest)" } as React.CSSProperties)
      : undefined;

  return (
    <div
      lang={appLocale}
      style={font}
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-4 pb-24 font-sans"
    >
      <Script
        src={telegramScript}
        strategy="afterInteractive"
        onReady={start}
      />
      {state === "loading" && (
        <p className="m-auto animate-pulse text-slate-300">{t.loading}</p>
      )}
      {state === "outside" && (
        <div className="m-auto flex flex-col items-center gap-4 text-center">
          <p className="text-slate-200">{t.openInTelegram}</p>
          <a
            href={`https://t.me/${bot}`}
            className="tap-target rounded-full bg-gradient-brand px-6 py-3 font-semibold text-white"
          >
            {t.openBot.replace("{bot}", bot)}
          </a>
        </div>
      )}
      {state === "failed" && (
        <p className="m-auto text-center text-slate-300">{t.failed}</p>
      )}
      {state === "ready" && home && (
        <>
          {tab === "panda" && <PandaTab home={home} />}
          {tab === "blitz" && (
            <BlitzTab
              home={home}
              language={blitzLanguage}
              onLanguage={setBlitzLanguage}
              onChange={load}
              onChallenge={(language) => void challenge(language)}
            />
          )}
          {tab === "league" && <LeagueTab home={home} invite={leagueInvite} />}
          {tab === "duel" && (
            <DuelTab
              home={home}
              duel={duel}
              onDuel={setDuel}
              notice={
                duelNotice === "duelLimit" || duelNotice === "failed"
                  ? t[duelNotice]
                  : null
              }
            />
          )}
          <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-md gap-2 bg-[#070814]/90 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
            {(["panda", "blitz", "duel", "league"] as const).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setTab(name);
                  if (name === "blitz") setBlitzLanguage(null);
                  if (name === "duel") setDuel(null);
                }}
                aria-current={tab === name ? "page" : undefined}
                className={`tap-target flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-xs font-semibold ${
                  tab === name
                    ? "bg-gradient-brand text-white"
                    : "text-slate-300 glass"
                }`}
              >
                <span aria-hidden className="text-lg leading-none">
                  {{ panda: "🐼", blitz: "⚡", duel: "⚔️", league: "👥" }[name]}
                </span>
                {t.tabs[name]}
              </button>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
