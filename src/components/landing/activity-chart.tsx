"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { useTranslations } from "next-intl";

export type ActivityPoint = { day: string; xp: number };

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  const t = useTranslations("common");
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs glass-strong">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold text-white">
        {t("xp", { count: Number(payload[0].value) })}
      </p>
    </div>
  );
}

export function ActivityChart({ data }: { data: ActivityPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 6, left: -18, bottom: 0 }}
      >
        <defs>
          <linearGradient id="xpFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="xpStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="55%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>
        <CartesianGrid
          vertical={false}
          stroke="rgb(255 255 255 / 0.06)"
          strokeDasharray="4 4"
        />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "rgb(226 232 255 / 0.5)", fontSize: 11 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "rgb(226 232 255 / 0.5)", fontSize: 11 }}
        />
        <Tooltip
          content={(props) => <ChartTooltip {...props} />}
          cursor={{ stroke: "rgb(255 255 255 / 0.2)" }}
        />
        <Area
          type="monotone"
          dataKey="xp"
          stroke="url(#xpStroke)"
          strokeWidth={2.5}
          fill="url(#xpFill)"
          dot={{ r: 3, fill: "#0d0f24", stroke: "#a78bfa", strokeWidth: 2 }}
          activeDot={{ r: 5, fill: "#f472b6", stroke: "#fff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
