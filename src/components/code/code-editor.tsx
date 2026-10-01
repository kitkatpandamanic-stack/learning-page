"use client";

import * as React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { EditorView } from "@codemirror/view";
import { tokyoNight } from "@uiw/codemirror-theme-tokyo-night";

import type { RunLanguage } from "@/lib/runner/execute";

// Blend the editor into our glass panels and use the site's code font.
const glassTheme = EditorView.theme({
  "&": { backgroundColor: "transparent", fontSize: "14px" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
    lineHeight: "1.7",
    fontVariantLigatures: "none",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    border: "none",
    color: "rgb(255 255 255 / 0.25)",
  },
  ".cm-activeLine": { backgroundColor: "rgb(139 92 246 / 0.1)" },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "rgb(255 255 255 / 0.6)",
  },
  ".cm-content": { padding: "12px 0" },
  ".cm-cursor": { borderLeftColor: "#22d3ee" },
});

export function CodeEditor({
  value,
  onChange,
  language,
  onRun,
  minHeight = "160px",
  label = "Code editor",
}: {
  value: string;
  onChange: (value: string) => void;
  language: RunLanguage;
  /** Called on Ctrl/Cmd + Enter */
  onRun?: () => void;
  minHeight?: string;
  label?: string;
}) {
  const extensions = React.useMemo(
    () => [
      javascript({ typescript: language === "typescript" }),
      glassTheme,
      EditorView.contentAttributes.of({ "aria-label": label }),
    ],
    [language, label],
  );

  return (
    // Ctrl/Cmd + Enter runs the code. Handled in the capture phase so it wins
    // over CodeMirror's own Mod-Enter binding (insert blank line).
    <div
      onKeyDownCapture={(event) => {
        if (
          onRun &&
          event.key === "Enter" &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault();
          event.stopPropagation();
          onRun();
        }
      }}
    >
      <CodeMirror
        value={value}
        onChange={onChange}
        theme={tokyoNight}
        extensions={extensions}
        minHeight={minHeight}
        basicSetup={{
          foldGutter: false,
          highlightActiveLineGutter: true,
          autocompletion: true,
        }}
        indentWithTab={false}
      />
    </div>
  );
}
