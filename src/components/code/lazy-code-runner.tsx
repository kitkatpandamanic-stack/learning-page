"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

function EditorPlaceholder() {
  const t = useTranslations("runner");
  return (
    <div className="not-prose flex h-64 animate-pulse items-center justify-center rounded-2xl border border-white/10 bg-space-950/60 text-sm text-white/40">
      {t("loadingEditor")}
    </div>
  );
}

/** The editor is a large bundle, so it loads after the lesson text. */
export const LazyCodeRunner = dynamic(
  () => import("./code-runner").then((m) => m.CodeRunner),
  { ssr: false, loading: () => <EditorPlaceholder /> },
);
