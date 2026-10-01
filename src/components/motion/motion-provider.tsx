"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";

/** Turns animations off for people who prefer reduced motion. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
