"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  completeLesson,
  recordActivity,
  type AwardResult,
} from "@/app/actions/progress";

export type LanguageProgress = {
  signedIn: boolean;
  completed: string[];
  activities: string[];
};

export const progressKey = (language: string) => ["progress", language];

/** The learner's completed lessons and rewarded activities in a language. */
export function useProgress(language: string) {
  return useQuery({
    queryKey: progressKey(language),
    queryFn: async (): Promise<LanguageProgress> => {
      const res = await fetch(`/api/progress?language=${language}`);
      if (!res.ok) throw new Error("Could not load progress");
      return res.json();
    },
  });
}

function celebrate(result: AwardResult, label: string) {
  if (!result.ok || result.xpAwarded === 0) return;
  toast.success(`+${result.xpAwarded} XP`, {
    description: label,
    icon: "⚡",
  });
  if (result.leveledUp) {
    toast(`Level ${result.level}!`, {
      description: "You levelled up. Keep going!",
      icon: "🚀",
    });
  }
  for (const a of result.newAchievements) {
    toast(`Achievement unlocked: ${a.title}`, {
      description: a.description,
      icon: a.emoji,
      duration: 6000,
    });
  }
}

/** Server actions that award XP, plus toasts and a progress refresh. */
export function useAward(language: string) {
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: progressKey(language) });

  return {
    async completeLesson(slug: string) {
      const result = await completeLesson(language, slug);
      if (result.ok) {
        celebrate(result, "Lesson complete!");
        await refresh();
      } else if (result.reason === "invalid") {
        toast.error("Couldn't save this lesson. Please refresh and try again.");
      }
      return result;
    },
    async recordActivity(permalink: string, activityId: string) {
      const result = await recordActivity(permalink, activityId);
      if (result.ok) {
        celebrate(
          result,
          activityId.startsWith("quiz")
            ? "Quiz answered on the first try"
            : "Exercise solved",
        );
        await refresh();
      }
      return result;
    },
  };
}

/** "/learn/javascript/variables" → "javascript" */
export function languageFromPath(pathname: string) {
  return pathname.split("/")[2] ?? "";
}
