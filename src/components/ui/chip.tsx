import * as React from "react";
import { cn } from "cn";

import { toneClasses, type Tone } from "@/lib/tones";

/** Small floating glass card with an icon, a label and an optional sub-label. */
function Chip({
  className,
  icon,
  label,
  sublabel,
  tone = "violet",
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  icon?: React.ReactNode;
  label: React.ReactNode;
  sublabel?: React.ReactNode;
  tone?: Tone;
}) {
  const t = toneClasses[tone];

  return (
    <div
      data-slot="chip"
      className={cn(
        "inline-flex items-center gap-3 rounded-2xl py-2 pr-4 pl-2 glass-strong",
        className,
      )}
      {...props}
    >
      {icon && (
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-xl [&_svg]:size-4.5",
            t.soft,
            t.text,
          )}
        >
          {icon}
        </span>
      )}
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold text-white">{label}</span>
        {sublabel && (
          <span className="text-xs text-muted-foreground">{sublabel}</span>
        )}
      </span>
    </div>
  );
}

export { Chip };
