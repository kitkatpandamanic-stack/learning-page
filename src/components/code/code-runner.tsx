"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  CheckCircle2,
  CircleCheckBig,
  Loader2,
  Play,
  RotateCcw,
  Square,
  Terminal,
  XCircle,
} from "lucide-react";
import { cn } from "cn";

import { CodeEditor } from "@/components/code/code-editor";
import { languageFromPath, useAward } from "@/components/progress/use-progress";
import { Button } from "@/components/ui/button";
import {
  compareOutput,
  type OutputLine,
  type RunLanguage,
  type TestSpec,
} from "@/lib/runner/execute";
import { runCode, type RunResult } from "@/lib/runner/run-code";

const languageLabel: Record<RunLanguage, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
};

const lineStyle: Record<OutputLine["level"], string> = {
  log: "text-white/85",
  info: "text-cyan-200",
  warn: "text-amber-200",
  error: "text-rose-300",
};

type Check = {
  tests: RunResult["tests"];
  output?: ReturnType<typeof compareOutput>;
  solved: boolean;
};

function readSaved(key: string | null) {
  if (!key) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSaved(key: string | null, value: string | null) {
  if (!key) return;
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable (private mode); the editor still works.
  }
}

export function CodeRunner({
  starter,
  language = "javascript",
  tests,
  expectedOutput,
  storageId,
  minHeight,
  activityId,
}: {
  starter: string;
  language?: RunLanguage;
  tests?: TestSpec[];
  /** Exact output the code should print (checked line by line) */
  expectedOutput?: string;
  /** Saves the learner's code in this browser under this id */
  storageId?: string;
  minHeight?: string;
  /** Lesson activity to reward with XP when solved */
  activityId?: string;
}) {
  const pathname = usePathname();
  const award = useAward(languageFromPath(pathname));
  const [reward, setReward] = React.useState<string | null>(null);
  const storageKey = storageId
    ? `pandadev:code:${pathname}:${storageId}`
    : null;
  const [code, setCode] = React.useState(
    () => readSaved(storageKey) ?? starter,
  );
  const [lines, setLines] = React.useState<OutputLine[]>([]);
  const [result, setResult] = React.useState<RunResult | null>(null);
  const [check, setCheck] = React.useState<Check | null>(null);
  const [running, setRunning] = React.useState(false);
  const cancelRef = React.useRef<(() => void) | null>(null);
  const canCheck = Boolean(tests?.length || expectedOutput !== undefined);

  React.useEffect(() => () => cancelRef.current?.(), []);

  function updateCode(value: string) {
    setCode(value);
    writeSaved(storageKey, value === starter ? null : value);
  }

  async function run(withChecks: boolean) {
    if (running) return;
    setRunning(true);
    setLines([]);
    setResult(null);
    setCheck(null);
    const { result: pending, cancel } = runCode(code, {
      language,
      tests: withChecks ? tests : undefined,
      onLine: (line) => setLines((prev) => [...prev, line]),
    });
    cancelRef.current = cancel;
    const res = await pending;
    cancelRef.current = null;
    setLines(res.output);
    setResult(res);
    setRunning(false);

    if (withChecks) {
      const output =
        expectedOutput !== undefined
          ? compareOutput(res.output, expectedOutput)
          : undefined;
      const solved =
        !res.error &&
        (res.tests ?? []).every((t) => t.passed) &&
        (output?.passed ?? true);
      setCheck({ tests: res.tests, output, solved });
      setReward(null);
      if (solved && activityId) {
        const result = await award.recordActivity(pathname, activityId);
        setReward(
          !result.ok
            ? result.reason === "signed-out"
              ? "Sign in to earn XP for exercises."
              : null
            : result.xpAwarded > 0
              ? `+${result.xpAwarded} XP`
              : "XP already earned for this one.",
        );
      }
    }
  }

  function reset() {
    cancelRef.current?.();
    updateCode(starter);
    setLines([]);
    setResult(null);
    setCheck(null);
  }

  return (
    <div className="not-prose overflow-hidden rounded-2xl border border-white/10 bg-space-950/70 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.06)]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/3 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-neon-pink" />
            <span className="size-2.5 rounded-full bg-neon-amber" />
            <span className="size-2.5 rounded-full bg-neon-lime" />
          </span>
          <span className="ml-1 font-mono text-xs text-white/50">
            {languageLabel[language]}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="text-white/60"
            title="Reset to the starting code"
          >
            <RotateCcw /> Reset
          </Button>
          {running ? (
            <Button
              variant="glass"
              size="sm"
              className="px-3"
              onClick={() => cancelRef.current?.()}
            >
              <Square /> Stop
            </Button>
          ) : (
            <Button
              variant="glass"
              size="sm"
              className="px-3"
              onClick={() => run(false)}
              title="Run (Ctrl/⌘ + Enter)"
            >
              <Play /> Run
            </Button>
          )}
          {canCheck && (
            <Button
              variant="gradient"
              size="sm"
              className="px-3"
              disabled={running}
              onClick={() => run(true)}
            >
              <CircleCheckBig /> Check
            </Button>
          )}
        </div>
      </div>

      <CodeEditor
        value={code}
        onChange={updateCode}
        language={language}
        onRun={() => run(canCheck)}
        minHeight={minHeight}
      />

      {/* Output */}
      <div className="border-t border-white/10 bg-black/35 px-4 py-3">
        <div className="mb-1.5 flex items-center justify-between font-mono text-[11px] tracking-wider text-white/45 uppercase">
          <span className="flex items-center gap-1.5">
            <Terminal className="size-3.5" /> Output
          </span>
          {running ? (
            <span className="flex items-center gap-1.5 normal-case">
              <Loader2 className="size-3 animate-spin" /> Running…
            </span>
          ) : (
            result && (
              <span className="normal-case">
                {Math.round(result.durationMs)} ms
              </span>
            )
          )}
        </div>
        <div
          role="log"
          aria-live="polite"
          className="max-h-64 overflow-y-auto font-mono text-sm leading-relaxed"
        >
          {lines.length > 0 ? (
            lines.map((line, i) => (
              <pre
                key={i}
                className={cn("whitespace-pre-wrap", lineStyle[line.level])}
              >
                {line.text}
              </pre>
            ))
          ) : (
            <p className="text-white/35">
              {result
                ? "(no output)"
                : "Press Run, or Ctrl/⌘ + Enter, to see what your code prints."}
            </p>
          )}
          {result?.error?.line && (
            <p className="mt-1 text-xs text-rose-300/80">
              ↑ on line {result.error.line}
            </p>
          )}
        </div>
      </div>

      {/* Check results */}
      {check && (
        <div className="flex flex-col gap-2 border-t border-white/10 px-4 py-3">
          {check.solved ? (
            <p className="flex items-center gap-2 rounded-xl bg-neon-lime/12 px-3 py-2.5 font-semibold text-lime-200 ring-1 ring-neon-lime/40">
              <CheckCircle2 className="size-5" /> Solved! Great work 🎉
              {reward && (
                <span className="ml-auto text-sm font-medium text-amber-200">
                  {reward}
                </span>
              )}
            </p>
          ) : (
            <p className="flex items-center gap-2 font-semibold text-rose-200">
              <XCircle className="size-5" /> Not quite yet, check the details
              below.
            </p>
          )}
          {check.output && !check.output.passed && (
            <div className="rounded-xl bg-white/5 px-3 py-2 font-mono text-xs">
              <p className="mb-1 text-white/55">
                Output line {check.output.line} doesn&apos;t match:
              </p>
              <p className="text-lime-200">
                expected: {check.output.expected ?? "(nothing more)"}
              </p>
              <p className="text-rose-200">
                got: {check.output.got ?? "(nothing)"}
              </p>
            </div>
          )}
          {check.tests && check.tests.length > 0 && (
            <ul className="flex flex-col gap-1">
              {check.tests.map((t) => (
                <li
                  key={t.name}
                  className="flex items-start gap-2 text-sm text-white/80"
                >
                  {t.passed ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-lime-300" />
                  ) : (
                    <XCircle className="mt-0.5 size-4 shrink-0 text-rose-300" />
                  )}
                  <span>
                    {t.name}
                    {t.error && (
                      <span className="block text-xs text-white/45">
                        {t.error}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
