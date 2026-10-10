"use client";

import * as React from "react";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowDownRight, ArrowUpRight, Snowflake } from "lucide-react";
import { cn } from "cn";

import type { Calendar, CalendarDay } from "@/lib/activity";

const levelClass = [
  "bg-white/6",
  "bg-violet-500/35",
  "bg-violet-400/60",
  "bg-fuchsia-400/80",
  "bg-pink-400",
] as const;

const asDate = (day: string) => new Date(`${day}T12:00:00Z`);

/**
 * The last six months as a grid of days (columns are weeks, Monday on top),
 * shaded by XP. Hover or tap a day to see what happened that day.
 */
export function ActivityCalendar({
  calendar,
  today,
}: {
  calendar: Calendar;
  today: string;
}) {
  const t = useTranslations("dashboard.activity");
  const format = useFormatter();
  const [selected, setSelected] = React.useState<CalendarDay | null>(null);
  const scroller = React.useRef<HTMLDivElement>(null);
  // Start at the latest weeks when the calendar is wider than the screen.
  React.useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);
  const { columns, months, totals } = calendar;

  const longDate = (day: string) =>
    format.dateTime(asDate(day), {
      weekday: "short",
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    });
  const describe = (day: CalendarDay) =>
    day.xp > 0
      ? t("day", { date: longDate(day.date), xp: day.xp })
      : day.frozen
        ? t("dayFrozen", { date: longDate(day.date) })
        : t("dayEmpty", { date: longDate(day.date) });
  // Monday, Wednesday and Friday label their rows.
  const weekdays = [0, 2, 4].map((row) => ({
    row,
    label: format.dateTime(asDate(columns[0][row]?.date ?? "2026-10-12"), {
      weekday: "short",
      timeZone: "UTC",
    }),
  }));
  const diff = totals.thisWeek - totals.lastWeek;

  return (
    <div className="flex flex-col gap-4">
      <p className="sr-only">
        {t("summary", { active: totals.activeDays, total: totals.totalDays })}
      </p>
      <div className="flex gap-2">
        {/* Weekday names: a spacer as tall as the month row, then 7 rows. */}
        <div
          aria-hidden
          className="flex flex-col gap-1.5 text-[0.68rem] leading-none text-white/45"
        >
          <span className="h-3.5" />
          <div className="grid flex-1 grid-rows-7 gap-[3px]">
            {weekdays.map((w) => (
              <span
                key={w.row}
                className="flex items-center"
                style={{ gridRowStart: w.row + 1 }}
              >
                {w.label}
              </span>
            ))}
          </div>
        </div>
        {/* On narrow screens the weeks scroll sideways, starting at today. */}
        <div
          ref={scroller}
          className="min-w-0 flex-1 [scrollbar-width:none] overflow-x-auto [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex min-w-[22rem] flex-col gap-1.5">
            <div
              aria-hidden
              className="grid h-3.5 text-[0.68rem] leading-none text-white/45"
              style={{
                gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
              }}
            >
              {months.map((m, i) => (
                <span
                  key={m.date}
                  className={cn(
                    "whitespace-nowrap",
                    // The latest month may have just begun: let its name
                    // stretch leftwards instead of being cut off.
                    i === months.length - 1
                      ? "justify-self-end"
                      : "overflow-hidden",
                  )}
                  style={{
                    gridRow: 1,
                    gridColumn: `${m.column + 1} / ${(months[i + 1]?.column ?? columns.length) + 1}`,
                  }}
                >
                  {format.dateTime(asDate(m.date), {
                    month: "short",
                    timeZone: "UTC",
                  })}
                </span>
              ))}
            </div>
            <div
              role="group"
              aria-label={t("title")}
              className="grid grid-flow-col grid-rows-7 gap-[3px]"
              style={{
                gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
              }}
              onMouseLeave={() => setSelected(null)}
            >
              {columns.flatMap((column, w) =>
                column.map((day, d) =>
                  day ? (
                    <button
                      key={day.date}
                      type="button"
                      tabIndex={-1}
                      aria-label={describe(day)}
                      onMouseEnter={() => setSelected(day)}
                      onFocus={() => setSelected(day)}
                      onClick={() => setSelected(day)}
                      className={cn(
                        "aspect-square w-full min-w-0 rounded-[3px] p-0 transition-transform hover:scale-125",
                        day.frozen
                          ? "bg-cyan-300/45 ring-1 ring-cyan-200/60 ring-inset"
                          : levelClass[day.level],
                        day.date === today && "ring-2 ring-white/80",
                        selected?.date === day.date && "ring-2 ring-amber-300",
                      )}
                    />
                  ) : (
                    <span key={`${w}-${d}`} className="aspect-square w-full" />
                  ),
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/55">
        <p aria-live="polite" className="min-h-4 text-white/75">
          {selected ? describe(selected) : t("hint")}
        </p>
        <div className="flex items-center gap-1.5">
          {t("less")}
          {levelClass.map((c) => (
            <span key={c} className={cn("size-3 rounded-[3px]", c)} />
          ))}
          {t("more")}
          <span className="ml-2 flex items-center gap-1">
            <span className="size-3 rounded-[3px] bg-cyan-300/45 ring-1 ring-cyan-200/60 ring-inset" />
            <Snowflake className="size-3 text-cyan-200" />
            {t("frozen")}
          </span>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-white/50">{t("thisWeek")}</dt>
          <dd className="text-lg font-bold text-white">
            {format.number(totals.thisWeek)} XP
          </dd>
          <dd
            className={cn(
              "flex items-center gap-0.5 text-xs",
              diff > 0
                ? "text-lime-300"
                : diff < 0
                  ? "text-pink-300"
                  : "text-white/50",
            )}
          >
            {diff > 0 && <ArrowUpRight className="size-3.5" />}
            {diff < 0 && <ArrowDownRight className="size-3.5" />}
            {diff === 0
              ? t("sameAsLast")
              : t("vsLast", {
                  diff: `${diff > 0 ? "+" : "−"}${format.number(Math.abs(diff))}`,
                })}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-white/50">{t("activeDays")}</dt>
          <dd className="text-lg font-bold text-white">{totals.activeDays}</dd>
          <dd className="text-xs text-white/50">
            {t("activeOf", { total: totals.totalDays })}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-white/50">{t("bestDay")}</dt>
          <dd className="text-lg font-bold text-white">
            {totals.best ? `${format.number(totals.best.xp)} XP` : "—"}
          </dd>
          <dd className="text-xs text-white/50">
            {totals.best
              ? format.dateTime(asDate(totals.best.date), {
                  day: "numeric",
                  month: "short",
                  timeZone: "UTC",
                })
              : t("noBest")}
          </dd>
        </div>
      </dl>
    </div>
  );
}
