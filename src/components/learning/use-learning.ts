"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";

import { saveForLater } from "@/app/actions/learning";
import type { ContinueTarget } from "@/lib/learning";

export const savedKey = ["saved"];
export const continueKey = (locale: string) => ["continue", locale];

/** The signed-in learner's saved permalinks (empty when signed out). */
export function useSaved() {
  return useQuery({
    queryKey: savedKey,
    queryFn: async (): Promise<{ signedIn: boolean; saved: string[] }> => {
      const res = await fetch("/api/bookmarks");
      if (!res.ok) throw new Error("Could not load saved pages");
      return res.json();
    },
  });
}

/** Saves or removes a page, updating every bookmark button right away. */
export function useToggleSaved() {
  const queryClient = useQueryClient();
  return async (permalink: string, saved: boolean) => {
    const previous = queryClient.getQueryData<{
      signedIn: boolean;
      saved: string[];
    }>(savedKey);
    if (previous) {
      queryClient.setQueryData(savedKey, {
        ...previous,
        saved: saved
          ? [permalink, ...previous.saved.filter((p) => p !== permalink)]
          : previous.saved.filter((p) => p !== permalink),
      });
    }
    try {
      const result = await saveForLater(permalink, saved);
      if (!result.ok && previous) queryClient.setQueryData(savedKey, previous);
      return result;
    } catch {
      if (previous) queryClient.setQueryData(savedKey, previous);
      return { ok: false as const, reason: "error" as const };
    }
  };
}

// ---------------------------------------------------------------------------
// Continue where you left off. Signed-in learners get it from the server (it
// follows them across devices); everyone also keeps the last page in this
// browser, so the home page can offer it before they sign in.
// ---------------------------------------------------------------------------

export type LastVisit = { permalink: string; title: string; at: number };

const LAST_VISIT_KEY = "pandadev:last-visit";

function parseLastVisit(raw: string | null): LastVisit | null {
  try {
    const value = JSON.parse(raw ?? "null");
    return value && typeof value.permalink === "string" ? value : null;
  } catch {
    return null;
  }
}

function readRaw() {
  try {
    return localStorage.getItem(LAST_VISIT_KEY);
  } catch {
    return null;
  }
}

export function writeLastVisit(visit: LastVisit) {
  try {
    localStorage.setItem(LAST_VISIT_KEY, JSON.stringify(visit));
  } catch {
    // Private mode or storage full: "continue" just won't remember this one.
  }
}

/** The signed-in learner's next page (null when signed out or nothing's left). */
export function useContinue(enabled = true) {
  const locale = useLocale();
  return useQuery({
    queryKey: continueKey(locale),
    enabled,
    queryFn: async (): Promise<{
      signedIn: boolean;
      target: ContinueTarget | null;
    }> => {
      const res = await fetch(`/api/continue?locale=${locale}`);
      if (!res.ok) throw new Error("Could not load where you left off");
      return res.json();
    },
  });
}

const subscribeStorage = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};

/** The last page opened in this browser (null on the server and before hydration). */
export function useLastVisit() {
  const raw = React.useSyncExternalStore(subscribeStorage, readRaw, () => null);
  return React.useMemo(() => parseLastVisit(raw), [raw]);
}
