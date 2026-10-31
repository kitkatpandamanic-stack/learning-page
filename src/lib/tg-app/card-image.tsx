import { ImageResponse } from "next/og";

import { ogFonts, pandaDataUri as logo } from "@/lib/og";
import { BOT_USERNAME } from "@/lib/telegram/api";
import type { Card } from "@/lib/tg-app/card";
import { pandaDataUri, pandaSvg, type PandaMood } from "@/lib/tg-app/panda";
import { appTexts, languageNames } from "@/lib/tg-app/texts";

const sizes = {
  story: { width: 1080, height: 1920 },
  wide: { width: 1200, height: 630 },
};

const blitzMood = (score: number, size: number): PandaMood =>
  score >= size * 0.8 ? "proud" : score >= size / 2 ? "happy" : "worried";

/**
 * A picture to share from the Mini App: a Blitz result or the learner's
 * panda, tall for Stories or wide for chats.
 */
export async function renderCard(card: Card) {
  const t = appTexts[card.locale];
  const story = card.format === "story";
  const size = sizes[card.format];
  const unit = story ? 1 : 0.55;
  const px = (n: number) => Math.round(n * unit);

  let eyebrow: string;
  let headline: string;
  let detail: string;
  let panda: string;
  /** Rows of coloured squares under the score */
  let grid: string[][] | null = null;
  const GREEN = "#22c55e";
  if (card.kind === "bughunt") {
    eyebrow = `${t.bugHuntTitle} · ${languageNames[card.language]}`;
    headline = `${card.score}/${card.answered}`;
    detail = t.bugHuntScore(card.score, card.answered);
    panda = pandaSvg({
      stage: 3,
      mood:
        card.answered === 0 ? "sleepy" : blitzMood(card.score, card.answered),
    });
  } else if (card.kind === "wordle") {
    const colors = { g: GREEN, y: "#eab308", x: "#475569" };
    eyebrow = `${t.wordleTitle(card.number)} · ${languageNames[card.language]}`;
    headline = `${card.solved ? card.rows.length : "X"}/6`;
    // Never the word itself: friends may still be playing it.
    detail = card.solved ? t.wordleSolved(card.rows.length) : t.wordleMissed;
    grid = card.rows.map((row) => row.map((m) => colors[m]));
    panda = pandaSvg({
      stage: 3,
      mood: !card.solved
        ? "worried"
        : card.rows.length <= 3
          ? "proud"
          : "happy",
    });
  } else if (card.kind !== "panda") {
    const size = card.kind === "blitz" ? 10 : 5;
    const score = card.grid.filter(Boolean).length;
    eyebrow =
      card.kind === "blitz"
        ? `${t.blitzTitle(card.number)} · ${languageNames[card.language]}`
        : `${t.tabs.duel} · ${languageNames[card.language]}`;
    headline = t.result(score, size);
    detail = t.seconds(card.seconds * 1000);
    grid = [
      Array.from({ length: size }, (_, i) =>
        card.grid[i] ? GREEN : "#ef4444",
      ),
    ];
    panda = pandaSvg({ stage: 3, mood: blitzMood(score, size) });
  } else {
    eyebrow = t.level(card.level);
    headline = card.locale === "ru" ? "Моя панда" : "My panda";
    detail =
      card.streak > 0
        ? `${t.streak}: ${t.days(card.streak)}`
        : t.level(card.level);
    panda = pandaSvg({
      stage: card.stage,
      mood: card.mood,
      outfit: card.outfit,
    });
  }

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: story ? "column" : "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: story ? "120px 80px" : "48px 64px",
        backgroundColor: "#070814",
        backgroundImage:
          "radial-gradient(circle at 15% 0%, #8b5cf6aa 0%, transparent 45%), radial-gradient(circle at 100% 100%, #22d3ee66 0%, transparent 45%), radial-gradient(circle at 85% 10%, #f472b655 0%, transparent 35%)",
        color: "white",
        fontFamily: "Onest, Onest Cyrillic",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: story ? "center" : "flex-start",
          gap: px(36),
          ...(story ? {} : { flex: 1 }),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: px(20) }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={px(80)} height={px(80)} alt="" />
          <div style={{ display: "flex", fontSize: px(56), fontWeight: 700 }}>
            Panda<span style={{ color: "#c4b5fd" }}>Dev</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            padding: `${px(12)}px ${px(32)}px`,
            borderRadius: 999,
            border: "2px solid rgba(255,255,255,0.25)",
            background: "rgba(255,255,255,0.08)",
            fontSize: px(40),
            color: "#a5f3fc",
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: px(card.kind === "panda" ? 120 : 200),
            fontWeight: 700,
            letterSpacing: -4,
            lineHeight: 1,
          }}
        >
          {headline}
        </div>
        <div style={{ display: "flex", fontSize: px(56), color: "#fcd34d" }}>
          {detail}
        </div>
        {grid && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: px(10) }}
          >
            {grid.map((row, r) => (
              <div
                key={r}
                style={{ display: "flex", gap: px(grid!.length > 1 ? 10 : 14) }}
              >
                {row.map((color, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      // Wordle's rows are smaller, so six of them fit.
                      width: px(grid!.length > 1 ? 52 : 68),
                      height: px(grid!.length > 1 ? 52 : 68),
                      borderRadius: px(12),
                      background: color,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={pandaDataUri(panda)}
        // A smaller panda leaves room for Wordle's six rows.
        width={story ? (grid && grid.length > 1 ? 520 : 760) : 420}
        height={story ? (grid && grid.length > 1 ? 572 : 836) : 462}
        alt=""
      />
      {story && (
        <div
          style={{
            display: "flex",
            fontSize: 44,
            color: "rgba(226,232,255,0.75)",
          }}
        >
          @{BOT_USERNAME}
        </div>
      )}
    </div>,
    { ...size, fonts: await ogFonts() },
  );
}
