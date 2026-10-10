import { Children, isValidElement, type ReactNode } from "react";
import { ChevronRight, Dumbbell, Eye } from "lucide-react";
import { useTranslations } from "next-intl";

import { LazyCodeRunner } from "@/components/code/lazy-code-runner";
import { HintSteps } from "@/components/mdx/hint-steps";
import type { RunLanguage, TestSpec } from "@/lib/runner/execute";

/**
 * A practice task. With a `starter`, learners write and run code right here,
 * and `tests` / `expectedOutput` let them check their answer automatically.
 */
export function Exercise({
  title,
  starter,
  language = "javascript",
  tests,
  expectedOutput,
  html,
  activityId,
  children,
}: {
  title?: string;
  /** Starting code for the in-browser editor */
  starter?: string;
  language?: RunLanguage;
  tests?: TestSpec[];
  expectedOutput?: string;
  /** JavaScript exercises: the page the code runs against, shown in a preview */
  html?: string;
  /** Added at build time ("exercise-1", …); used to award XP once */
  activityId?: string;
  children: ReactNode;
}) {
  const t = useTranslations("lesson");
  // Show the task first, then the editor, then the hints (one step at a
  // time) and the solution.
  const items = Children.toArray(children);
  const isHint = (node: ReactNode) =>
    isValidElement(node) && node.type === Hint;
  const isSolution = (node: ReactNode) =>
    isValidElement(node) && node.type === Solution;
  const task = items.filter((node) => !isHint(node) && !isSolution(node));
  const hints = items
    .filter(isHint)
    .map((node) =>
      isValidElement<{ children: ReactNode }>(node)
        ? node.props.children
        : null,
    );
  const solutions = items.filter(isSolution);

  return (
    <section className="not-prose my-8 rounded-2xl bg-gradient-to-r from-neon-violet/60 via-neon-pink/40 to-neon-cyan/60 p-px">
      <div className="rounded-[calc(1rem-1px)] bg-space-900/90 p-5 backdrop-blur-xl">
        <p className="mb-3 flex items-center gap-2 font-semibold text-white">
          <span className="flex size-8 items-center justify-center rounded-lg bg-neon-violet/20 text-violet-300">
            <Dumbbell className="size-4" />
          </span>
          {title ?? t("yourTurn")}
        </p>
        <div className="exercise-body flex flex-col gap-3 text-[0.95rem] leading-relaxed text-white/85">
          {task}
          {starter !== undefined && (
            <LazyCodeRunner
              starter={starter}
              language={language}
              tests={tests}
              expectedOutput={expectedOutput}
              html={html}
              storageId={activityId ?? title ?? "exercise"}
              activityId={activityId}
            />
          )}
          <HintSteps hints={hints} />
          {solutions}
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

/** One step of help inside an <Exercise>; its hints open one at a time. */
export function Hint({ children }: { children: ReactNode }) {
  return <HintSteps hints={[children]} />;
}

export function Solution({ children }: { children: ReactNode }) {
  const t = useTranslations("lesson");
  return (
    <Reveal
      icon={<Eye className="size-4 text-lime-300" />}
      label={t("showSolution")}
    >
      {children}
    </Reveal>
  );
}
