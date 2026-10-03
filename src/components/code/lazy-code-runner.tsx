"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

import type { CodeRunner as CodeRunnerType } from "./code-runner";

type RunnerProps = React.ComponentProps<typeof CodeRunnerType>;

function EditorPlaceholder({ height }: { height?: number }) {
  const t = useTranslations("runner");
  return (
    <div
      className="not-prose flex h-64 animate-pulse items-center justify-center rounded-2xl border border-white/10 bg-space-950/60 text-sm text-white/40"
      style={height ? { height } : undefined}
    >
      {t("loadingEditor")}
    </div>
  );
}

const loadRunner = () => import("./code-runner");
const CodeRunner = dynamic(() => loadRunner().then((m) => m.CodeRunner), {
  ssr: false,
  loading: () => <EditorPlaceholder />,
});

/** How close (in pixels) an editor gets to the screen before it loads. */
const LOAD_MARGIN = 800;
/** Editors wait until scrolling pauses for this long (ms). */
const SCROLL_PAUSE = 150;

/**
 * About how tall the finished runner is (measured): ~24px per line of code,
 * the toolbar and output panel, and the live preview if there is one. A
 * placeholder of the same height means little moves when it loads.
 */
function estimatedHeight({ starter, html, language, minHeight }: RunnerProps) {
  const lines = starter.split("\n").length;
  const editor = Math.max(lines * 23.8 + 24, parseInt(minHeight ?? "160", 10));
  const preview = html !== undefined || language === "react" ? 234 : 0;
  return Math.round(editor + 165 + preview);
}

let lastScroll = 0;
if (typeof window !== "undefined") {
  window.addEventListener(
    "scroll",
    () => {
      lastScroll = performance.now();
    },
    { passive: true },
  );
}

/**
 * The editor is a large bundle (and Python's runtime is larger still), so
 * each editor loads only when it comes near the screen, not with the lesson
 * text: phones show the lesson quickly and download editors as the learner
 * scrolls to them. They wait for scrolling to pause, so a fling or a jump
 * to a heading doesn't load (and resize) every editor it passes.
 */
export function LazyCodeRunner(props: RunnerProps) {
  const [near, setNear] = React.useState(false);
  const placeholder = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const element = placeholder.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const loadWhenStill = () => {
      const quietFor = performance.now() - lastScroll;
      if (quietFor >= SCROLL_PAUSE) {
        observer.disconnect();
        // Keep the sized placeholder until the editor's code has arrived.
        void loadRunner().then(
          () => setNear(true),
          () => setNear(true), // let next/dynamic show its own error/retry
        );
      } else {
        timer = setTimeout(loadWhenStill, SCROLL_PAUSE - quietFor);
      }
    };
    const observer = new IntersectionObserver(
      (entries) => {
        clearTimeout(timer);
        if (entries.some((entry) => entry.isIntersecting)) loadWhenStill();
      },
      { rootMargin: `${LOAD_MARGIN}px 0px` },
    );
    observer.observe(element);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  if (near) return <CodeRunner {...props} />;
  return (
    <div ref={placeholder}>
      <EditorPlaceholder height={estimatedHeight(props)} />
    </div>
  );
}
