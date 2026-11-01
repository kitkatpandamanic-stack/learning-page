import { GitBranch } from "lucide-react";
import { useTranslations } from "next-intl";

import type { CommitGraph } from "@/lib/runner/shell/graph";
import { cn } from "cn";

const ROW = 28;
const LANE = 16;
const PAD = 6;
const DOT = 4.5;

/** One colour per lane, from the site's neon set. */
const COLORS = [
  "var(--color-lang-git)",
  "var(--color-neon-cyan)",
  "var(--color-neon-pink)",
  "var(--color-neon-amber)",
  "var(--color-neon-violet)",
];
const color = (lane: number) => COLORS[lane % COLORS.length];

const x = (lane: number) => PAD + lane * LANE + LANE / 2;
const y = (row: number) => row * ROW + ROW / 2;

/** A smooth bend from one lane to another over one row. */
function bend(fromLane: number, fromY: number, toLane: number, toY: number) {
  const mid = (fromY + toY) / 2;
  return `C ${x(fromLane)} ${mid} ${x(toLane)} ${mid} ${x(toLane)} ${toY}`;
}

/**
 * The repository after a terminal run, like `git log --graph --oneline
 * --all`: one row per commit, newest at the top, branches in coloured lanes.
 */
export function CommitGraphView({ graph }: { graph: CommitGraph }) {
  const t = useTranslations("runner.graph");
  const rows = graph.commits.length;
  const height = rows * ROW + (graph.more ? ROW / 2 : 0);
  const width = PAD * 2 + graph.lanes * LANE;

  const paths = graph.edges.map((e, i) => {
    const top = y(e.from);
    const bottom = e.to === null ? height : y(e.to);
    let d = `M ${x(e.fromLane)} ${top}`;
    if (e.to !== null && e.to - e.from === 1)
      d += ` ${bend(e.fromLane, top, e.toLane, bottom)}`;
    else {
      let at = top;
      if (e.lane !== e.fromLane) {
        at = top + ROW;
        d += ` ${bend(e.fromLane, top, e.lane, at)}`;
      }
      const end = e.toLane !== e.lane ? bottom - ROW : bottom;
      if (end > at) d += ` L ${x(e.lane)} ${end}`;
      if (e.toLane !== e.lane) d += ` ${bend(e.lane, end, e.toLane, bottom)}`;
    }
    return (
      <path
        key={i}
        d={d}
        fill="none"
        stroke={color(e.lane)}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={e.to === null ? 0.5 : 0.85}
      />
    );
  });

  return (
    <figure className="border-t border-white/10 bg-black/25 px-4 py-3">
      <figcaption className="mb-1.5 flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-white/65 uppercase">
        <GitBranch className="size-3.5" /> {t("title")}
      </figcaption>
      <div className="max-h-[28rem] overflow-y-auto">
        <div className="relative flex" style={{ minHeight: height }}>
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="shrink-0"
            aria-hidden="true"
          >
            {paths}
            {graph.commits.map((c, i) => (
              <circle
                key={c.hash}
                cx={x(c.lane)}
                cy={y(i)}
                r={c.head ? DOT + 1 : DOT}
                fill={c.head ? "#0b0b14" : color(c.lane)}
                stroke={color(c.lane)}
                strokeWidth={c.head ? 3 : 0}
              />
            ))}
          </svg>
          <ol className="min-w-0 flex-1 font-mono text-sm">
            {graph.commits.map((c) => (
              <li
                key={c.hash}
                className="flex items-center gap-2 whitespace-nowrap"
                style={{ height: ROW }}
              >
                <span className="text-amber-200/90">{c.short}</span>
                {c.labels.map((label) => (
                  <span
                    key={`${label.kind}-${label.name}`}
                    className={cn(
                      "rounded-md px-1.5 py-px text-xs font-semibold",
                      label.kind === "head" &&
                        "bg-lang-git/20 text-lime-200 ring-1 ring-lang-git/60",
                      label.kind === "branch" &&
                        "bg-neon-cyan/15 text-cyan-200 ring-1 ring-neon-cyan/40",
                      label.kind === "tag" &&
                        "bg-neon-amber/15 text-amber-200 ring-1 ring-neon-amber/40",
                    )}
                  >
                    {label.kind === "head" && label.name !== "HEAD"
                      ? `HEAD → ${label.name}`
                      : label.kind === "tag"
                        ? `🏷 ${label.name}`
                        : label.name}
                  </span>
                ))}
                <span className="truncate text-white/85">{c.message}</span>
                {c.head && <span className="sr-only">{t("youAreHere")}</span>}
              </li>
            ))}
          </ol>
        </div>
        {graph.more > 0 && (
          <p className="pt-1 text-xs text-white/55">
            {t("more", { count: graph.more })}
          </p>
        )}
      </div>
    </figure>
  );
}
