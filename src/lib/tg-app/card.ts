/**
 * The share pictures' URLs (/api/tg/card): only numbers and known names go
 * in, so nobody can make the site draw their own text. No server imports.
 */
import {
  outfits,
  slotOf,
  type Outfit,
  type OutfitId,
  type PandaMood,
  type PandaStage,
} from "@/lib/tg-app/panda";
import { languageNames, type AppLocale } from "@/lib/tg-app/texts";

export type CardFormat = "story" | "wide";

export type Card =
  | {
      kind: "blitz";
      locale: AppLocale;
      format: CardFormat;
      number: number;
      language: string;
      grid: boolean[];
      seconds: number;
    }
  | {
      kind: "panda";
      locale: AppLocale;
      format: CardFormat;
      stage: PandaStage;
      mood: PandaMood;
      outfit: Outfit;
      level: number;
      streak: number;
    };

const moods: PandaMood[] = ["proud", "happy", "worried", "sleepy"];

const int = (value: string | null, min: number, max: number) => {
  if (value === null || !/^\d{1,5}$/.test(value)) return null;
  const n = Number(value);
  return n >= min && n <= max ? n : null;
};

export function cardQuery(card: Card) {
  const q = new URLSearchParams({
    k: card.kind,
    l: card.locale,
    f: card.format,
  });
  if (card.kind === "blitz") {
    q.set("n", String(card.number));
    q.set("lang", card.language);
    q.set("g", card.grid.map((ok) => (ok ? "1" : "0")).join(""));
    q.set("t", String(card.seconds));
  } else {
    q.set("s", String(card.stage));
    q.set("m", card.mood);
    q.set("o", Object.values(card.outfit).filter(Boolean).join(","));
    q.set("lv", String(card.level));
    q.set("st", String(card.streak));
  }
  return q.toString();
}

export function parseCard(q: URLSearchParams): Card | null {
  const locale = q.get("l") === "ru" ? "ru" : q.get("l") === "en" ? "en" : null;
  const format = q.get("f") === "wide" ? "wide" : "story";
  if (!locale) return null;
  if (q.get("k") === "blitz") {
    const number = int(q.get("n"), 1, 99_999);
    const seconds = int(q.get("t"), 0, 60);
    const language = q.get("lang") ?? "";
    const grid = q.get("g") ?? "";
    if (number === null || seconds === null) return null;
    if (!(language in languageNames) || !/^[01]{0,10}$/.test(grid)) return null;
    return {
      kind: "blitz",
      locale,
      format,
      number,
      language,
      grid: [...grid].map((c) => c === "1"),
      seconds,
    };
  }
  if (q.get("k") === "panda") {
    const stage = int(q.get("s"), 1, 4) as PandaStage | null;
    const level = int(q.get("lv"), 1, 999);
    const streak = int(q.get("st"), 0, 99_999);
    const mood = q.get("m") as PandaMood;
    if (stage === null || level === null || streak === null) return null;
    if (!moods.includes(mood)) return null;
    const outfit: Outfit = {};
    for (const id of (q.get("o") ?? "").split(",").filter(Boolean)) {
      if (!outfits.some((o) => o.id === id)) return null;
      outfit[slotOf(id as OutfitId)] = id as OutfitId;
    }
    return {
      kind: "panda",
      locale,
      format,
      stage,
      mood,
      outfit,
      level,
      streak,
    };
  }
  return null;
}
