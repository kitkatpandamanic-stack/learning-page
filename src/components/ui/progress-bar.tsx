import * as React from "react";
import { useTranslations } from "next-intl";
import { cn } from "cn";

import { toneClasses, type Tone } from "@/lib/tones";

const sizes = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-3.5",
};

function ProgressBar({
  className,
  value,
  max = 100,
  tone = "violet",
  size = "md",
  label,
  showValue = false,
  "aria-label": ariaLabel,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  value: number;
  max?: number;
  tone?: Tone;
  size?: keyof typeof sizes;
  label?: React.ReactNode;
  showValue?: boolean;
}) {
  const t = toneClasses[tone];
  const common = useTranslations("common");
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      data-slot="progress-bar"
      className={cn("flex w-full flex-col gap-1.5", className)}
      {...props}
    >
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/80">{label}</span>
          {showValue && (
            <span className={cn("font-mono font-medium", t.text)}>
              {Math.round(percent)}%
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={
          ariaLabel ?? (typeof label === "string" ? label : common("progress"))
        }
        className={cn(
          "w-full overflow-hidden rounded-full bg-white/8 ring-1 ring-white/5 ring-inset",
          sizes[size],
        )}
      >
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ease-out",
            t.gradient,
            t.glow,
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export { ProgressBar };
