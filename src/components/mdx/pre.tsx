"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";

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

  return (
    <div className="group/pre relative">
      <pre ref={ref} {...props} />
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? t("copied") : t("copyCode")}
        className="absolute top-2.5 right-2.5 flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 opacity-0 backdrop-blur transition group-hover/pre:opacity-100 hover:text-white focus-visible:opacity-100"
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
