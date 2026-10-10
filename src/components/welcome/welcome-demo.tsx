"use client";

import { toast } from "sonner";

import { WelcomeSteps } from "@/components/welcome/welcome-steps";
import { languages } from "@/lib/languages";

const sample = languages
  .filter((l) => ["python", "javascript", "typescript", "sql"].includes(l.slug))
  .map((language) => ({
    language,
    lessons: 60,
    starts: ["Hello, World!", "Lists", "Async and Await"],
  }));

/** The welcome steps with sample data, saving nothing (design page only). */
export function WelcomeDemo() {
  return (
    <WelcomeSteps
      languages={sample}
      initial={{}}
      next=""
      skipHref="/design"
      save={async (choice) => {
        toast(
          `${choice.language} · level ${choice.level} · ${choice.dailyGoal} XP`,
        );
        return { ok: true, href: "/design" };
      }}
    />
  );
}
