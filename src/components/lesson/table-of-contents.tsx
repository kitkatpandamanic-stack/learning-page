"use client";

import * as React from "react";
import { cn } from "cn";

export type TocEntry = { title: string; url: string; items: TocEntry[] };

function flatten(
  entries: TocEntry[],
  depth = 0,
): (TocEntry & { depth: number })[] {
  return entries.flatMap((e) => [
    { ...e, depth },
    ...flatten(e.items, depth + 1),
  ]);
}

/** "On this page" list that highlights the heading currently in view. */
export function TableOfContents({ toc }: { toc: TocEntry[] }) {
  const items = React.useMemo(() => flatten(toc), [toc]);
  const [active, setActive] = React.useState<string | null>(null);

  React.useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.url.slice(1)))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(`#${visible[0].target.id}`);
      },
      { rootMargin: "-96px 0px -65% 0px" },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav aria-label="On this page">
      <p className="mb-3 text-xs font-semibold tracking-wider text-white/50 uppercase">
        On this page
      </p>
      <ul className="flex flex-col gap-1 border-l border-white/10">
        {items.map((item) => (
          <li key={item.url}>
            <a
              href={item.url}
              className={cn(
                "-ml-px block border-l py-1 text-sm text-white/55 transition hover:text-white",
                item.depth > 0 ? "pl-6" : "pl-3",
                active === item.url
                  ? "border-neon-violet text-white"
                  : "border-transparent",
              )}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
