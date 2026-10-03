"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import type { CodeRunner as CodeRunnerType } from "./code-runner";
import {
  editorHeight,
  EmptyOutput,
  OutputPanel,
  RunnerPreview,
  RunnerToolbar,
  runnerFrameClass,
} from "./runner-frame";

type RunnerProps = React.ComponentProps<typeof CodeRunnerType>;

/**
 * Stands in for the runner while it loads: the same toolbar and output
 * panel, and a box as tall as the editor will be, so nothing below moves
 * when the editor replaces it.
 */
function EditorPlaceholder(props: RunnerProps) {
  const { starter, language = "javascript", minHeight, html } = props;
  const t = useTranslations("runner");
  return (
    <div className={runnerFrameClass}>
      <RunnerToolbar
        language={language}
        canCheck={Boolean(
          props.tests?.length || props.expectedOutput !== undefined,
        )}
      />
      <div
        className="flex animate-pulse items-center justify-center bg-white/2 text-sm text-white/40"
        style={{ height: editorHeight(starter, minHeight) }}
      >
        {t("loadingEditor")}
      </div>
      {(html !== undefined || language === "react" || language === "tsx") && (
        <RunnerPreview />
      )}
      <OutputPanel>
        <EmptyOutput>{t("pressRun")}</EmptyOutput>
      </OutputPanel>
    </div>
  );
}

const loadRunner = () => import("./code-runner");
const CodeRunner = React.lazy(() =>
  loadRunner().then((m) => ({ default: m.CodeRunner })),
);

/** How close (in pixels) an editor gets to the screen before it loads. */
const LOAD_MARGIN = 800;
/** Editors wait until scrolling pauses for this long (ms). */
const SCROLL_PAUSE = 150;

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
          () => setNear(true), // React.lazy then reports the error
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

  if (near) {
    return (
      <React.Suspense fallback={<EditorPlaceholder {...props} />}>
        <CodeRunner {...props} />
      </React.Suspense>
    );
  }
  return (
    <div ref={placeholder}>
      <EditorPlaceholder {...props} />
    </div>
  );
}
