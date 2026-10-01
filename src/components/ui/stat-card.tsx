import * as React from "react";
import { cn } from "cn";

import { GlassCard } from "@/components/ui/glass-card";
import { toneClasses, type Tone } from "@/lib/tones";

function StatCard({
  className,
  label,
  value,
  delta,
  icon,
  tone = "violet",
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  label: React.ReactNode;
  value: React.ReactNode;
  /** Short trend line such as "+12% this week" */
  delta?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: Tone;
}) {
  const t = toneClasses[tone];

  return (
    <GlassCard
      data-slot="stat-card"
      padding="sm"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        {icon && (
          <span
            className={cn(
              "flex size-7 items-center justify-center rounded-lg [&_svg]:size-3.5",
              t.soft,
              t.text,
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <span className="text-2xl font-bold tracking-tight text-white">
        {value}
      </span>
      {delta && <span className={cn("text-xs", t.text)}>{delta}</span>}
    </GlassCard>
  );
}

export { StatCard };
