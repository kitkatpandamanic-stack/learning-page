"use client";

import * as React from "react";

import { rememberVisit } from "@/app/actions/learning";
import { writeLastVisit } from "@/components/learning/use-learning";
import { useSession } from "@/lib/auth-client";

/**
 * Remembers the lesson or problem being viewed, for "continue where you left
 * off": in this browser for everyone, and on the server for signed-in learners.
 */
export function VisitTracker({
  permalink,
  title,
}: {
  permalink: string;
  title: string;
}) {
  const { data: session, isPending } = useSession();
  const userId = session?.user.id;

  React.useEffect(() => {
    writeLastVisit({ permalink, title, at: Date.now() });
  }, [permalink, title]);

  React.useEffect(() => {
    if (isPending || !userId) return;
    rememberVisit(permalink).catch(() => {
      // Offline: the visit simply isn't remembered on the server this time.
    });
  }, [permalink, userId, isPending]);

  return null;
}
