import { cn } from "cn";

import { toneClasses, type Tone } from "@/lib/tones";

/**
 * A small bar chart of one value per day (no JavaScript): hover a bar for
 * its day and value.
 */
export function DailyBars({
  data,
  tone = "violet",
  label,
  formatDay,
}: {
  data: { day: string; value: number }[];
  tone?: Tone;
  label: string;
  formatDay: (day: string) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex flex-col gap-1.5">
      <div
        role="img"
        aria-label={label}
        className="flex h-28 items-end gap-[2px]"
      >
        {data.map((d) => (
          <span
            key={d.day}
            title={`${formatDay(d.day)}: ${d.value}`}
            className={cn(
              "min-h-[2px] flex-1 rounded-t-[2px] transition-opacity hover:opacity-80",
              d.value > 0 ? toneClasses[tone].fill : "bg-white/8",
            )}
            style={{ height: `${(d.value / max) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[0.68rem] text-white/40">
        <span>{formatDay(data[0]?.day ?? "")}</span>
        <span>{formatDay(data.at(-1)?.day ?? "")}</span>
      </div>
    </div>
  );
}
