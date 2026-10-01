import type { ReactNode } from "react";
import { ChevronRight, Dumbbell, Eye, Lightbulb } from "lucide-react";

/**
 * A practice task. Running and checking code in the browser arrives in Phase 6;
 * for now learners try it in their own editor and reveal hints and the solution.
 */
export function Exercise({
  title = "Your turn",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="not-prose my-8 rounded-2xl bg-gradient-to-r from-neon-violet/60 via-neon-pink/40 to-neon-cyan/60 p-px">
      <div className="rounded-[calc(1rem-1px)] bg-space-900/90 p-5 backdrop-blur-xl">
        <p className="mb-3 flex items-center gap-2 font-semibold text-white">
          <span className="flex size-8 items-center justify-center rounded-lg bg-neon-violet/20 text-violet-300">
            <Dumbbell className="size-4" />
          </span>
          {title}
        </p>
        <div className="exercise-body flex flex-col gap-3 text-[0.95rem] leading-relaxed text-white/85">
          {children}
        </div>
      </div>
    </section>
  );
}

function Reveal({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-xl border border-white/10 bg-white/4 open:bg-white/6">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-medium text-white/80 select-none hover:text-white [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-4 transition group-open:rotate-90" />
        {icon}
        {label}
      </summary>
      <div className="flex flex-col gap-2 px-3 pb-3">{children}</div>
    </details>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return (
    <Reveal icon={<Lightbulb className="size-4 text-amber-300" />} label="Hint">
      {children}
    </Reveal>
  );
}

export function Solution({ children }: { children: ReactNode }) {
  return (
    <Reveal
      icon={<Eye className="size-4 text-lime-300" />}
      label="Show solution"
    >
      {children}
    </Reveal>
  );
}
