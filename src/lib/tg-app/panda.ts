/**
 * The learner's panda in the Telegram Mini App: it grows with their level,
 * its mood follows today's practice, and achievements unlock things to wear.
 * Drawn as an SVG string, so the app and the share pictures (next/og) draw
 * the same panda. No server imports.
 */

export type PandaMood = "proud" | "happy" | "worried" | "sleepy";
export type PandaStage = 1 | 2 | 3 | 4;
export type OutfitSlot = "head" | "face" | "neck";
export type OutfitId =
  "crown" | "cap" | "headphones" | "headband" | "glasses" | "scarf" | "bowtie";
export type Outfit = Partial<Record<OutfitSlot, OutfitId>>;

/** Each item, its slot, and the achievement that unlocks it (best first per slot). */
export const outfits: {
  id: OutfitId;
  slot: OutfitSlot;
  achievement: string;
}[] = [
  { id: "crown", slot: "head", achievement: "xp-500" },
  { id: "cap", slot: "head", achievement: "level-complete" },
  { id: "headphones", slot: "head", achievement: "ten-exercises" },
  { id: "headband", slot: "head", achievement: "streak-3" },
  { id: "glasses", slot: "face", achievement: "first-exercise" },
  { id: "scarf", slot: "neck", achievement: "module-complete" },
  { id: "bowtie", slot: "neck", achievement: "five-lessons" },
];

export function pandaStage(level: number): PandaStage {
  if (level >= 7) return 4;
  if (level >= 4) return 3;
  if (level >= 2) return 2;
  return 1;
}

/**
 * Proud once today's goal is met, happy after any practice today, worried
 * when a streak is waiting for today's practice, sleepy otherwise.
 */
export function pandaMood(s: {
  activeToday: boolean;
  streak: number;
  todayXp: number;
  dailyGoal: number;
}): PandaMood {
  if (s.todayXp >= s.dailyGoal) return "proud";
  if (s.activeToday) return "happy";
  if (s.streak > 0) return "worried";
  return "sleepy";
}

export function unlockedOutfits(achievements: string[]) {
  const have = new Set(achievements);
  return outfits.filter((o) => have.has(o.achievement)).map((o) => o.id);
}

/** What the panda wears: the learner's picks if still unlocked, else the best per slot. */
export function wornOutfit(unlocked: OutfitId[], picked: Outfit = {}): Outfit {
  const worn: Outfit = {};
  for (const slot of ["head", "face", "neck"] as const) {
    const choice = picked[slot];
    if (choice && unlocked.includes(choice) && slotOf(choice) === slot) {
      worn[slot] = choice;
      continue;
    }
    // An explicit "nothing here" is kept.
    if (slot in picked && picked[slot] === undefined) continue;
    worn[slot] = outfits.find(
      (o) => o.slot === slot && unlocked.includes(o.id),
    )?.id;
  }
  return worn;
}

export const slotOf = (id: OutfitId) => outfits.find((o) => o.id === id)!.slot;

/** Parses the outfit saved in Telegram's CloudStorage; anything odd is ignored. */
export function parseOutfit(text: string | null | undefined): Outfit {
  try {
    const value = JSON.parse(text ?? "{}");
    const outfit: Outfit = {};
    for (const slot of ["head", "face", "neck"] as const) {
      if (!(slot in value)) continue;
      const id = value[slot];
      if (id === null) outfit[slot] = undefined;
      else if (outfits.some((o) => o.id === id && o.slot === slot))
        outfit[slot] = id;
    }
    return outfit;
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

const INK = "#1a1640";
const FUR = "#f5f3ff";
const CYAN = "#22d3ee";
const PINK = "#f472b6";

function eyes(mood: PandaMood) {
  const patches = `<ellipse cx="78" cy="88" rx="13" ry="17" transform="rotate(-25 78 88)" fill="${INK}"/><ellipse cx="122" cy="88" rx="13" ry="17" transform="rotate(25 122 88)" fill="${INK}"/>`;
  switch (mood) {
    case "proud":
      return `${patches}<path d="M72 90 Q79 82 86 90" stroke="${FUR}" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M114 90 Q121 82 128 90" stroke="${FUR}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    case "sleepy":
      return `${patches}<path d="M72 90 Q79 95 86 90" stroke="${FUR}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M114 90 Q121 95 128 90" stroke="${FUR}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    case "worried":
      return `${patches}<circle cx="80" cy="89" r="5" fill="${FUR}"/><circle cx="120" cy="89" r="5" fill="${FUR}"/><circle cx="81" cy="90" r="2.5" fill="${INK}"/><circle cx="119" cy="90" r="2.5" fill="${INK}"/><path d="M68 70 L84 62" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M132 70 L116 62" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    default:
      return `${patches}<circle cx="80" cy="88" r="4" fill="${CYAN}"/><circle cx="120" cy="88" r="4" fill="${CYAN}"/><circle cx="81.5" cy="86.5" r="1.4" fill="${FUR}"/><circle cx="121.5" cy="86.5" r="1.4" fill="${FUR}"/>`;
  }
}

function mouth(mood: PandaMood) {
  switch (mood) {
    case "proud":
      return `<path d="M88 110 Q100 126 112 110 Z" fill="${PINK}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
    case "happy":
      return `<path d="M90 110 Q100 119 110 110" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    case "worried":
      return `<path d="M90 115 Q95 110 100 115 Q105 120 110 115" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    default:
      return `<ellipse cx="100" cy="114" rx="4" ry="3" fill="${INK}"/>`;
  }
}

function extras(mood: PandaMood) {
  if (mood === "sleepy")
    return `<path d="M150 40 h12 l-12 13 h12" stroke="#a5b4fc" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M168 18 h9 l-9 10 h9" stroke="#a5b4fc" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (mood === "worried")
    return `<path d="M150 70 Q144 82 150 86 Q156 82 150 70 Z" fill="#7dd3fc"/>`;
  if (mood === "proud")
    return `<path d="M30 50 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 Z" fill="#fcd34d"/><path d="M166 34 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z" fill="#fcd34d"/>`;
  return "";
}

const cheeks = (mood: PandaMood) =>
  mood === "proud" || mood === "happy"
    ? `<circle cx="66" cy="106" r="7" fill="${PINK}" opacity="0.45"/><circle cx="134" cy="106" r="7" fill="${PINK}" opacity="0.45"/>`
    : "";

const items: Record<OutfitId, string> = {
  crown: `<path d="M70 44 L76 18 L90 34 L100 12 L110 34 L124 18 L130 44 Z" fill="#fcd34d" stroke="#f59e0b" stroke-width="2.5" stroke-linejoin="round"/><circle cx="100" cy="36" r="4" fill="${PINK}"/>`,
  cap: `<path d="M60 36 L100 20 L140 36 L100 52 Z" fill="${INK}"/><rect x="82" y="38" width="36" height="12" rx="3" fill="${INK}"/><path d="M140 36 L140 58" stroke="#fcd34d" stroke-width="3"/><circle cx="140" cy="61" r="4" fill="#fcd34d"/>`,
  headphones: `<path d="M50 84 Q50 28 100 28 Q150 28 150 84" stroke="#8b5cf6" stroke-width="8" fill="none" stroke-linecap="round"/><rect x="40" y="76" width="18" height="30" rx="8" fill="#8b5cf6"/><rect x="142" y="76" width="18" height="30" rx="8" fill="#8b5cf6"/>`,
  headband: `<path d="M52 62 Q100 44 148 62" stroke="#ef4444" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M100 50 Q92 40 100 28 Q103 38 108 36 Q110 46 100 50 Z" fill="#f97316"/>`,
  glasses: `<circle cx="79" cy="89" r="15" fill="none" stroke="${CYAN}" stroke-width="3.5"/><circle cx="121" cy="89" r="15" fill="none" stroke="${CYAN}" stroke-width="3.5"/><path d="M94 88 Q100 84 106 88" stroke="${CYAN}" stroke-width="3" fill="none"/>`,
  scarf: `<path d="M62 132 Q100 148 138 132 L138 144 Q100 160 62 144 Z" fill="#8b5cf6"/><path d="M118 146 L126 176 L112 176 L108 150 Z" fill="#7c3aed"/>`,
  bowtie: `<path d="M100 140 L82 130 L82 152 Z" fill="${PINK}"/><path d="M100 140 L118 130 L118 152 Z" fill="${PINK}"/><circle cx="100" cy="140" r="5" fill="#db2777"/>`,
};

/** The panda as an SVG document (200 × 220). */
export function pandaSvg({
  stage,
  mood,
  outfit = {},
}: {
  stage: PandaStage;
  mood: PandaMood;
  outfit?: Outfit;
}) {
  // Smaller pandas sit lower, so they all stand on the same ground.
  const scale = [0.7, 0.8, 0.9, 1][stage - 1];
  const dx = 100 * (1 - scale);
  const dy = 216 * (1 - scale);
  const wear = (slot: OutfitSlot) => (outfit[slot] ? items[outfit[slot]] : "");
  const body = [
    `<ellipse cx="100" cy="212" rx="${60 * scale}" ry="6" fill="#000" opacity="0.25"/>`,
    `<g transform="translate(${dx} ${dy}) scale(${scale})">`,
    // Body, arms and feet
    `<ellipse cx="100" cy="165" rx="56" ry="46" fill="${FUR}"/>`,
    `<ellipse cx="54" cy="160" rx="16" ry="26" transform="rotate(20 54 160)" fill="${INK}"/>`,
    `<ellipse cx="146" cy="160" rx="16" ry="26" transform="rotate(-20 146 160)" fill="${INK}"/>`,
    `<ellipse cx="74" cy="204" rx="20" ry="12" fill="${INK}"/>`,
    `<ellipse cx="126" cy="204" rx="20" ry="12" fill="${INK}"/>`,
    `<ellipse cx="100" cy="172" rx="30" ry="26" fill="#ede9fe"/>`,
    wear("neck"),
    // Head and ears
    `<circle cx="58" cy="44" r="18" fill="url(#ear)"/>`,
    `<circle cx="142" cy="44" r="18" fill="url(#ear)"/>`,
    `<ellipse cx="100" cy="88" rx="54" ry="50" fill="${FUR}"/>`,
    cheeks(mood),
    eyes(mood),
    `<ellipse cx="100" cy="103" rx="6" ry="4.5" fill="${INK}"/>`,
    mouth(mood),
    wear("face"),
    wear("head"),
    `</g>`,
    extras(mood),
  ].join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" width="200" height="220"><defs><linearGradient id="ear" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#f472b6"/></linearGradient></defs>${body}</svg>`;
}

export const pandaDataUri = (svg: string) =>
  `data:image/svg+xml;base64,${typeof btoa === "function" ? btoa(svg) : Buffer.from(svg).toString("base64")}`;
