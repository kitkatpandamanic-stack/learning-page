"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";

/** How many lines a highlighted code block has (Shiki marks each with data-line). */
function countLines(children: React.ReactNode): number {
  let lines = 0;
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement<{ children?: React.ReactNode }>(child)) return;
    if ((child.props as Record<string, unknown>)["data-line"] !== undefined) {
      lines++;
    } else {
      lines += countLines(child.props.children);
    }
  });
  return lines;
}

/** Line height × font size of lesson code (globals.css), and the padding. */
const LINE_REM = 1.7 * 0.875;
const PADDING_REM = 2.25;

/** Code block with a copy button. Highlighting is done at build time by Shiki. */
export function Pre(props: React.ComponentProps<"pre">) {
  const ref = React.useRef<HTMLPreElement>(null);
  const [copied, setCopied] = React.useState(false);
  const t = useTranslations("lesson");

  async function copy() {
    const text = ref.current?.textContent ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be unavailable (e.g. insecure context); fail quietly.
    }
  }

  // Long lessons have dozens of code blocks (thousands of elements). The
  // browser skips laying out and painting the ones far off-screen; its size
  // estimate comes from the line count (code doesn't wrap), so jumping to a
  // heading still lands in the right place.
  const lines = countLines(props.children);
  const style = lines
    ? {
        contentVisibility: "auto" as const,
        containIntrinsicSize: `auto ${(lines * LINE_REM + PADDING_REM).toFixed(2)}rem`,
      }
    : undefined;

  return (
    <div className="group/pre relative" style={style}>
      <pre ref={ref} {...props} />
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? t("copied") : t("copyCode")}
        className="absolute top-2.5 right-2.5 flex size-8 items-center justify-center rounded-lg border border-white/10 bg-space-900/90 text-white/60 opacity-0 transition group-hover/pre:opacity-100 hover:text-white focus-visible:opacity-100"
      >
        {copied ? (
          <Check className="size-4 text-lime-300" />
        ) : (
          <Copy className="size-4" />
        )}
      </button>
    </div>
  );
}
