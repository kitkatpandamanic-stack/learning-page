"use client";

import type * as React from "react";
import {
  AppWindow,
  CircleCheckBig,
  Play,
  RotateCcw,
  Square,
  Terminal,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import type { RunLanguage } from "@/lib/runner/execute";

// The code runner's frame: toolbar, preview pane and output panel. The real
// runner (code-runner.tsx) and its loading placeholder (lazy-code-runner.tsx)
// share them, so the placeholder wraps the same way on every screen width
// and the page doesn't move when the editor arrives. Kept free of the
// editor's heavy imports.

export const languageLabel: Record<RunLanguage, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  react: "React",
};

export const runnerFrameClass =
  "not-prose overflow-hidden rounded-2xl border border-white/10 bg-space-950/70 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.06)]";

/** The editor's height: lines of 1.7 × 14px, plus 12px padding top and bottom. */
export function editorHeight(code: string, minHeight = "160px") {
  const lines = code.split("\n").length;
  return Math.max(lines * 23.8 + 24, parseInt(minHeight, 10));
}

/** Without handlers the buttons are inert (the loading placeholder). */
export function RunnerToolbar({
  language,
  canCheck,
  running = false,
  onReset,
  onRun,
  onStop,
  onCheck,
}: {
  language: RunLanguage;
  canCheck: boolean;
  running?: boolean;
  onReset?: () => void;
  onRun?: () => void;
  onStop?: () => void;
  onCheck?: () => void;
}) {
  const t = useTranslations("runner");
  const inert = !onRun;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/3 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-neon-pink" />
          <span className="size-2.5 rounded-full bg-neon-amber" />
          <span className="size-2.5 rounded-full bg-neon-lime" />
        </span>
        <span className="ml-1 font-mono text-xs text-white/50">
          {languageLabel[language]}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={inert}
          className="text-white/60"
          title={t("resetTitle")}
        >
          <RotateCcw /> {t("reset")}
        </Button>
        {running ? (
          <Button variant="glass" size="sm" className="px-3" onClick={onStop}>
            <Square /> {t("stop")}
          </Button>
        ) : (
          <Button
            variant="glass"
            size="sm"
            className="px-3"
            onClick={onRun}
            disabled={inert}
            title={t("runTitle")}
          >
            <Play /> {t("run")}
          </Button>
        )}
        {canCheck && (
          <Button
            variant="gradient"
            size="sm"
            className="px-3"
            disabled={inert || running}
            onClick={onCheck}
          >
            <CircleCheckBig /> {t("check")}
          </Button>
        )}
      </div>
    </div>
  );
}

export function RunnerPreview({ ref }: { ref?: React.Ref<HTMLDivElement> }) {
  const t = useTranslations("runner");
  return (
    <div className="border-t border-white/10">
      <p className="flex items-center gap-1.5 bg-white/3 px-4 py-1.5 font-mono text-[11px] tracking-wider text-white/65 uppercase">
        <AppWindow className="size-3.5" /> {t("preview")}
      </p>
      <div ref={ref} className="h-56 resize-y overflow-hidden bg-[#0b0d1f]" />
    </div>
  );
}

export function OutputPanel({
  status,
  tall = false,
  children,
}: {
  /** Shown at the right of the header (running, or how long it took) */
  status?: React.ReactNode;
  /** Room for charts */
  tall?: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations("runner");
  return (
    <div className="border-t border-white/10 bg-black/35 px-4 py-3">
      <div className="mb-1.5 flex items-center justify-between font-mono text-[11px] tracking-wider text-white/65 uppercase">
        <span className="flex items-center gap-1.5">
          <Terminal className="size-3.5" /> {t("output")}
        </span>
        {status}
      </div>
      <div
        role="log"
        aria-live="polite"
        className={cn(
          "overflow-y-auto font-mono text-sm leading-relaxed",
          tall ? "max-h-[32rem]" : "max-h-64",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * The output panel's hint before anything has run. It keeps two lines of
 * room, so the panel is the same height whether the hint wraps or not.
 */
export function EmptyOutput({ children }: { children: React.ReactNode }) {
  return <p className="min-h-[2lh] text-white/55">{children}</p>;
}
