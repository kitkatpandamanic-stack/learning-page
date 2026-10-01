import * as React from "react";
import { cn } from "cn";

import { toneClasses, type Tone } from "@/lib/tones";

function Badge({
  className,
  tone = "violet",
  dot = false,
  children,
  ...props
}: React.ComponentProps<"span"> & {
  tone?: Tone | "neutral";
  /** Show a small glowing dot before the label */
  dot?: boolean;
}) {
  const t = tone === "neutral" ? null : toneClasses[tone];

  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-md",
        t
          ? [t.soft, t.border, t.text]
          : "border-white/15 bg-white/8 text-white/80",
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          aria-hidden
          className={cn(
            "size-1.5 rounded-full shadow-[0_0_8px_currentColor]",
            t ? t.fill : "bg-white",
          )}
        />
      )}
      {children}
    </span>
  );
}

export { Badge };
