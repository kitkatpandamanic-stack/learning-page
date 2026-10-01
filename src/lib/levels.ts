import { Crown, Rocket, Sprout, Wrench, type LucideIcon } from "lucide-react";

import type { Tone } from "@/lib/tones";

export type LevelNumber = 0 | 1 | 2 | 3;

/** The four-level ladder every language follows. */
export const levels: {
  level: LevelNumber;
  name: string;
  tagline: string;
  icon: LucideIcon;
  tone: Tone;
  topics: string[];
}[] = [
  {
    level: 0,
    name: "Beginner",
    tagline: "Your first lines of code",
    icon: Sprout,
    tone: "lime",
    topics: [
      "Variables & types",
      "Conditions & loops",
      "Functions",
      "First mini-games",
    ],
  },
  {
    level: 1,
    name: "Junior",
    tagline: "Build real things",
    icon: Wrench,
    tone: "cyan",
    topics: [
      "Data structures",
      "OOP & modules",
      "Errors & debugging",
      "Git & tooling",
    ],
  },
  {
    level: 2,
    name: "Middle",
    tagline: "Work like a pro",
    icon: Rocket,
    tone: "violet",
    topics: ["Async & APIs", "Testing", "Design patterns", "Databases"],
  },
  {
    level: 3,
    name: "Senior",
    tagline: "Lead and architect",
    icon: Crown,
    tone: "amber",
    topics: [
      "System design",
      "Performance",
      "Security",
      "Code review & mentoring",
    ],
  },
];
