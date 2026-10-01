/**
 * Accent "tones" shared by the glass components. Class names are written out
 * in full so Tailwind can detect them.
 */
export const TONES = ["violet", "cyan", "pink", "lime", "amber"] as const;

export type Tone = (typeof TONES)[number];

export const toneClasses: Record<
  Tone,
  {
    /** Readable text on a dark background */
    text: string;
    /** Solid fill (dots, bars) */
    fill: string;
    /** Translucent background for pills and icon tiles */
    soft: string;
    border: string;
    glow: string;
    /** Gradient stops for bars and buttons */
    gradient: string;
  }
> = {
  violet: {
    text: "text-violet-300",
    fill: "bg-neon-violet",
    soft: "bg-neon-violet/15",
    border: "border-neon-violet/40",
    glow: "shadow-glow-violet",
    gradient: "from-neon-violet to-neon-pink",
  },
  cyan: {
    text: "text-cyan-300",
    fill: "bg-neon-cyan",
    soft: "bg-neon-cyan/15",
    border: "border-neon-cyan/40",
    glow: "shadow-glow-cyan",
    gradient: "from-neon-cyan to-neon-violet",
  },
  pink: {
    text: "text-pink-300",
    fill: "bg-neon-pink",
    soft: "bg-neon-pink/15",
    border: "border-neon-pink/40",
    glow: "shadow-glow-pink",
    gradient: "from-neon-pink to-neon-amber",
  },
  lime: {
    text: "text-lime-300",
    fill: "bg-neon-lime",
    soft: "bg-neon-lime/15",
    border: "border-neon-lime/40",
    glow: "shadow-glow-lime",
    gradient: "from-neon-lime to-neon-cyan",
  },
  amber: {
    text: "text-amber-300",
    fill: "bg-neon-amber",
    soft: "bg-neon-amber/15",
    border: "border-neon-amber/40",
    glow: "shadow-glow-amber",
    gradient: "from-neon-amber to-neon-pink",
  },
};
