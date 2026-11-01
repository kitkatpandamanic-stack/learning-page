"use client";

import * as React from "react";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { undo } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { PostgreSQL, sql } from "@codemirror/lang-sql";
import { indentUnit, StreamLanguage } from "@codemirror/language";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import { setDiagnostics } from "@codemirror/lint";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { tokyoNightInit } from "@uiw/codemirror-theme-tokyo-night";

import type { RunLanguage } from "@/lib/runner/execute";

// Tokyo Night, but with readable comments: exercise instructions live in comments.
const theme = tokyoNightInit({
  settings: { background: "transparent", gutterBackground: "transparent" },
  styles: [{ tag: [tags.comment, tags.meta], color: "#9aa5ce" }],
});

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
    color: "rgb(255 255 255 / 0.45)",
  },
  ".cm-activeLine": { backgroundColor: "rgb(139 92 246 / 0.1)" },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "rgb(255 255 255 / 0.6)",
  },
  ".cm-content": { padding: "12px 0" },
  ".cm-cursor": { borderLeftColor: "#22d3ee" },
  ".cm-tooltip": {
    backgroundColor: "#0d0f22",
    border: "1px solid rgb(255 255 255 / 0.12)",
    borderRadius: "10px",
    overflow: "hidden",
  },
  ".cm-diagnostic": { fontFamily: "var(--font-jetbrains), ui-monospace" },
  ".cm-diagnostic-error": { borderLeftColor: "#fb7185", color: "#fecdd3" },
});

/** A problem to underline, e.g. a TypeScript type error. */
export type EditorDiagnostic = {
  start: number;
  length: number;
  message: string;
};

/** How the key bar shows its keys */
const keyLabels: Record<string, string> = { tab: "⇥", undo: "↶" };

export function CodeEditor({
  value,
  onChange,
  language,
  onRun,
  minHeight = "160px",
  label = "Code editor",
  diagnostics,
  keys,
}: {
  value: string;
  onChange: (value: string) => void;
  language: RunLanguage;
  /** Called on Ctrl/Cmd + Enter */
  onRun?: () => void;
  minHeight?: string;
  label?: string;
  /** Underlined in the editor, with the message on hover */
  diagnostics?: EditorDiagnostic[];
  /**
   * For phones: a row of keys under the editor (text to type, "tab" for one
   * indent, and "undo", always added first; `label` names the row), and
   * long lines wrap instead of scrolling sideways
   */
  keys?: { list: string[]; label: string };
}) {
  const editor = React.useRef<ReactCodeMirrorRef>(null);

  React.useEffect(() => {
    const view = editor.current?.view;
    if (!view) return;
    const size = view.state.doc.length;
    view.dispatch(
      setDiagnostics(
        view.state,
        (diagnostics ?? []).map((d) => {
          const from = Math.min(d.start, size);
          return {
            from,
            to: Math.min(from + Math.max(d.length, 1), size),
            severity: "error",
            message: d.message,
          };
        }),
      ),
    );
  }, [diagnostics]);

  const phone = Boolean(keys);
  const extensions = React.useMemo(
    () => [
      language === "python"
        ? // Python style (PEP 8) and all our lessons use 4-space indents.
          [python(), indentUnit.of("    ")]
        : language === "sql"
          ? sql({ dialect: PostgreSQL, upperCaseKeywords: true })
          : language === "shell"
            ? StreamLanguage.define(shell)
            : javascript({
                typescript: language === "typescript" || language === "tsx",
                jsx: language === "react" || language === "tsx",
              }),
      glassTheme,
      EditorView.contentAttributes.of({ "aria-label": label }),
      phone ? EditorView.lineWrapping : [],
    ],
    [language, label, phone],
  );

  function press(key: string) {
    const view = editor.current?.view;
    if (!view) return;
    if (key === "undo") undo(view);
    else {
      const text = key === "tab" ? view.state.facet(indentUnit) : key;
      view.dispatch(view.state.replaceSelection(text), {
        scrollIntoView: true,
        userEvent: "input.type",
      });
    }
    view.focus();
  }

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
        ref={editor}
        value={value}
        onChange={onChange}
        theme={theme}
        extensions={extensions}
        minHeight={minHeight}
        basicSetup={{
          foldGutter: false,
          highlightActiveLineGutter: true,
          autocompletion: true,
        }}
        indentWithTab={false}
      />
      {keys && (
        <div
          role="toolbar"
          aria-label={keys.label}
          className="flex [scrollbar-width:none] gap-1.5 overflow-x-auto border-t border-white/10 px-3 py-2"
        >
          {["undo", ...keys.list].map((key) => (
            <button
              key={key}
              type="button"
              // Keeps the editor focused, so the phone keyboard stays open.
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => press(key)}
              aria-label={key === "tab" ? "Tab" : key === "undo" ? "Undo" : key}
              className="min-w-10 shrink-0 rounded-lg bg-white/8 px-2.5 py-2 font-mono text-sm text-white/85 active:bg-white/20"
            >
              {keyLabels[key] ?? key}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
