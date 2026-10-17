"use client";

import { useEffect, useState } from "react";

import {
  canShareStory,
  shareToChat,
  shareToStory,
} from "@/components/tg/share";
import { haptic, webApp } from "@/components/tg/telegram";
import type { MiniAppHome } from "@/lib/tg-app/home";
import {
  outfits,
  parseOutfit,
  pandaSvg,
  wornOutfit,
  type Outfit,
  type OutfitId,
} from "@/lib/tg-app/panda";
import { appTexts } from "@/lib/tg-app/texts";

const OUTFIT_KEY = "panda_outfit";

/** The panda, drawn from enums only (no user text), so it's safe as HTML. */
function Panda({ svg, className }: { svg: string; className?: string }) {
  return (
    <div
      aria-hidden
      className={className}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export function PandaTab({ home }: { home: MiniAppHome }) {
  const t = appTexts[home.locale];
  const panda = home.panda;
  const [picked, setPicked] = useState<Outfit>({});

  // What the learner put on, kept in Telegram's cloud storage for this bot.
  useEffect(() => {
    webApp()?.CloudStorage?.getItem(OUTFIT_KEY, (error, value) => {
      if (!error) setPicked(parseOutfit(value));
    });
  }, []);

  if (!panda) {
    return (
      <section className="flex flex-col items-center gap-4 pt-6 text-center">
        <Panda
          svg={pandaSvg({ stage: 1, mood: "sleepy" })}
          className="w-48 animate-float"
        />
        <h1 className="text-2xl font-bold text-white">{t.guestTitle}</h1>
        <p className="text-slate-300">{t.guestText}</p>
        <button
          type="button"
          onClick={() => webApp()?.openLink(home.profileUrl)}
          className="tap-target rounded-full bg-gradient-brand px-6 py-3 font-semibold text-white"
        >
          {t.connect}
        </button>
      </section>
    );
  }

  const worn = wornOutfit(panda.unlocked, picked);
  const toggle = (id: OutfitId) => {
    const slot = outfits.find((o) => o.id === id)!.slot;
    const next = { ...picked, [slot]: worn[slot] === id ? undefined : id };
    setPicked(next);
    haptic("tap");
    // null marks "nothing here" (JSON has no undefined).
    const saved = Object.fromEntries(
      Object.entries(next).map(([k, v]) => [k, v ?? null]),
    );
    webApp()?.CloudStorage?.setItem(OUTFIT_KEY, JSON.stringify(saved));
  };
  const outfitParam = JSON.stringify(
    Object.fromEntries(
      (["head", "face", "neck"] as const).map((s) => [s, worn[s] ?? null]),
    ),
  );

  const stats = [
    { label: t.streak, value: `🔥 ${t.days(panda.streak)}` },
    { label: t.best, value: `🏅 ${t.days(panda.best)}` },
    {
      label: t.today,
      value: `🎯 ${Math.min(panda.todayXp, panda.dailyGoal)}/${panda.dailyGoal} XP`,
    },
    { label: t.freezes, value: `🧊 ${panda.freezes}` },
    { label: t.quizStreak, value: `🧠 ${t.days(panda.quizStreak)}` },
    { label: "XP", value: `⭐ ${panda.totalXp}` },
  ];

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col items-center text-center">
        <p className="text-sm text-cyan-200">{t.level(panda.level)}</p>
        <h1 className="text-2xl font-bold text-white">
          {t.hello(home.firstName)}
        </h1>
        <Panda
          svg={pandaSvg({ stage: panda.stage, mood: panda.mood, outfit: worn })}
          className="my-2 w-56 animate-float"
        />
        <p className="text-slate-200">{t.mood[panda.mood]}</p>
      </div>

      <dl className="grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl px-3 py-2 glass">
            <dt className="text-xs text-slate-400">{s.label}</dt>
            <dd className="font-semibold text-white">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="rounded-2xl p-4 glass">
        <h2 className="font-semibold text-white">{t.wardrobe}</h2>
        <p className="mb-3 text-sm text-slate-400">{t.wardrobeHint}</p>
        <ul className="grid gap-2">
          {outfits.map((o) => {
            const unlocked = panda.unlocked.includes(o.id);
            const on = worn[o.slot] === o.id;
            return (
              <li key={o.id}>
                <button
                  type="button"
                  disabled={!unlocked}
                  onClick={() => toggle(o.id)}
                  aria-pressed={on}
                  className={`tap-target flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${
                    on
                      ? "bg-violet-500/25 text-white ring-1 ring-violet-400"
                      : unlocked
                        ? "bg-white/5 text-slate-200"
                        : "bg-white/5 text-slate-400"
                  }`}
                >
                  <span>{t.outfits[o.id]}</span>
                  <span>{unlocked ? (on ? "✓" : "") : `🔒 ${t.locked}`}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() =>
            void shareToChat({ kind: "panda", outfit: outfitParam })
          }
          className="tap-target flex-1 rounded-full bg-gradient-brand px-4 py-3 font-semibold text-white"
        >
          {t.sharePanda}
        </button>
        {canShareStory() && (
          <button
            type="button"
            onClick={() =>
              void shareToStory({ kind: "panda", outfit: outfitParam })
            }
            className="tap-target rounded-full px-4 py-3 font-semibold text-white glass"
          >
            {t.shareStory}
          </button>
        )}
      </div>
    </section>
  );
}
