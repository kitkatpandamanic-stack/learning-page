"use client";

import { useEffect } from "react";

import { whenIdle } from "@/lib/idle";

/**
 * Registers public/sw.js, which keeps Python, the TypeScript compiler and
 * React after their first download, and visited lessons for offline use.
 * Production only: in development it would serve stale code.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      // A production build tried on localhost may have left one behind;
      // it would serve the dev server stale files.
      void navigator.serviceWorker
        .getRegistrations()
        .then((all) => all.forEach((r) => void r.unregister()));
      return;
    }
    return whenIdle(() => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Not supported or blocked (e.g. private mode): the site works without it.
      });
    });
  }, []);
  return null;
}
