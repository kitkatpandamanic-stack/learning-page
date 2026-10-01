"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations, type Messages } from "next-intl";
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

type ProgressT = ReturnType<typeof useTranslations<"progress">>;
type AchievementsT = ReturnType<typeof useTranslations<"achievements">>;
type AchievementId = keyof Messages["achievements"];

function celebrate(
  result: AwardResult,
  label: string,
  t: ProgressT,
  tAchievements: AchievementsT,
) {
  if (!result.ok || result.xpAwarded === 0) return;
  toast.success(t("toast.xp", { xp: result.xpAwarded }), {
    description: label,
    icon: "⚡",
  });
  if (result.leveledUp) {
    toast(t("toast.levelUp", { level: result.level }), {
      description: t("toast.levelUpBody"),
      icon: "🚀",
    });
  }
  for (const a of result.newAchievements) {
    // The server sends English text; show the learner's language by id.
    const id = a.id as AchievementId;
    const known = tAchievements.has(`${id}.title`);
    toast(
      t("toast.achievement", {
        title: known ? tAchievements(`${id}.title`) : a.title,
      }),
      {
        description: known ? tAchievements(`${id}.description`) : a.description,
        icon: a.emoji,
        duration: 6000,
      },
    );
  }
}

type ClientAwardResult = AwardResult | { ok: false; reason: "error" };

/** Calls a server action; a network or server failure becomes a toast. */
async function attempt(
  action: () => Promise<AwardResult>,
  t: ProgressT,
): Promise<ClientAwardResult> {
  try {
    return await action();
  } catch {
    toast.error(t("toast.offline"), {
      description: t("toast.offlineBody"),
    });
    return { ok: false, reason: "error" };
  }
}

/** Server actions that award XP, plus toasts and a progress refresh. */
export function useAward(language: string) {
  const t = useTranslations("progress");
  const tAchievements = useTranslations("achievements");
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: progressKey(language) });

  return {
    async completeLesson(slug: string) {
      const result = await attempt(() => completeLesson(language, slug), t);
      if (result.ok) {
        celebrate(result, t("toast.lessonComplete"), t, tAchievements);
        await refresh();
      } else if (result.reason === "invalid") {
        toast.error(t("toast.saveFailed"));
      }
      return result;
    },
    async recordActivity(permalink: string, activityId: string) {
      const result = await attempt(
        () => recordActivity(permalink, activityId),
        t,
      );
      if (result.ok) {
        celebrate(
          result,
          activityId.startsWith("quiz")
            ? t("toast.quizAced")
            : t("toast.exerciseSolved"),
          t,
          tAchievements,
        );
        await refresh();
      }
      return result;
    },
  };
}

/** "/learn/javascript/variables" → "javascript" (a path without the locale, from @/i18n/navigation) */
export function languageFromPath(pathname: string) {
  return pathname.split("/")[2] ?? "";
}
