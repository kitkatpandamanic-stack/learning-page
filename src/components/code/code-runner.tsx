"use client";

import * as React from "react";
import { usePathname } from "@/i18n/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "cn";

import { CodeEditor } from "@/components/code/code-editor";
import {
  EmptyOutput,
  languageLabel,
  OutputPanel,
  RunnerPreview,
  RunnerToolbar,
  runnerFrameClass,
} from "@/components/code/runner-frame";
import { localizeRunnerText } from "@/components/code/runner-messages";
import { languageFromPath, useAward } from "@/components/progress/use-progress";
import {
  compareOutput,
  type OutputLine,
  type RunLanguage,
  type TestSpec,
} from "@/lib/runner/execute";
import { REACT_HTML } from "@/lib/runner/dom-harness";
import { runCode, type RunResult, type RunStatus } from "@/lib/runner/run-code";
import { runDom, type DomRun } from "@/lib/runner/run-dom";
import { whenIdle } from "@/lib/idle";
import { isPythonReady, preloadPython } from "@/lib/runner/run-python";
import {
  isTypeScriptReady,
  preloadTypeScript,
} from "@/lib/runner/run-typecheck";

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
  html: page,
  autoRun = false,
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
  /** Runs the code against this page and shows it in a live preview */
  html?: string;
  /** Preview only: run the code as soon as the editor appears (demos) */
  autoRun?: boolean;
}) {
  // React code always runs in the preview, on an empty page by default.
  const react = language === "react";
  const html = page ?? (react ? REACT_HTML : undefined);
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("runner");
  const award = useAward(languageFromPath(pathname));
  const [reward, setReward] = React.useState<string | null>(null);
  // Each language keeps its own saved code (starters' comments differ).
  const storageKey = storageId
    ? `pandadev:code:${pathname}:${storageId}${locale === "en" ? "" : `:${locale}`}`
    : null;
  const [code, setCode] = React.useState(
    () => readSaved(storageKey) ?? starter,
  );
  const [lines, setLines] = React.useState<OutputLine[]>([]);
  const [result, setResult] = React.useState<RunResult | null>(null);
  const [check, setCheck] = React.useState<Check | null>(null);
  const [running, setRunning] = React.useState(false);
  const [status, setStatus] = React.useState<RunStatus | null>(null);
  // Packages being installed, e.g. "pandas, numpy"
  const [installing, setInstalling] = React.useState("");
  const cancelRef = React.useRef<(() => void) | null>(null);
  const previewRef = React.useRef<HTMLDivElement>(null);
  const previewRun = React.useRef<DomRun | null>(null);
  // The preview page's localStorage, kept between runs (and in this browser
  // for exercises), so apps that save data still have it after Run.
  const pageStorage = React.useRef<Record<string, string> | null>(null);
  const pageStorageKey = storageKey ? `${storageKey}:page-storage` : null;

  function readPageStorage() {
    if (!pageStorage.current) {
      try {
        pageStorage.current = JSON.parse(readSaved(pageStorageKey) ?? "{}");
      } catch {
        pageStorage.current = {};
      }
    }
    return pageStorage.current ?? {};
  }

  function savePageStorage(data: Record<string, string>) {
    pageStorage.current = data;
    writeSaved(
      pageStorageKey,
      Object.keys(data).length > 0 ? JSON.stringify(data) : null,
    );
  }
  const canCheck = Boolean(tests?.length || expectedOutput !== undefined);
  const hasPreview = html !== undefined;

  React.useEffect(
    () => () => {
      cancelRef.current?.();
      previewRun.current?.dispose();
    },
    [],
  );

  // Show the page straight away: demos with their code, exercises without.
  React.useEffect(() => {
    if (html === undefined || !previewRef.current) return;
    const preview = runDom(autoRun ? code : "", {
      html,
      container: previewRef.current,
      onLine: autoRun
        ? (line) => setLines((prev) => [...prev, line])
        : undefined,
      storage: readPageStorage(),
      onStorage: savePageStorage,
      react,
    });
    previewRun.current = preview;
    return () => preview.dispose();
    // Only on mount: later runs replace the preview themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Python and the TypeScript checker take a few seconds to download the
  // first time; start early, but after the page has finished loading so
  // the download doesn't slow the lesson itself down.
  React.useEffect(() => {
    if (language !== "python" && language !== "typescript") return;
    const preload = language === "python" ? preloadPython : preloadTypeScript;
    return whenIdle(preload);
  }, [language]);

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
    setStatus(
      (language === "python" && !isPythonReady()) ||
        (language === "typescript" && !isTypeScriptReady())
        ? "loading"
        : null,
    );
    const { res, checked } = await (html !== undefined
      ? runPreview(html, withChecks)
      : runPlain(withChecks));
    setLines(res.output);
    setResult(res);
    setRunning(false);
    setStatus(null);

    if (withChecks) {
      // Code with type errors never ran, so there's no output to compare.
      const output =
        expectedOutput !== undefined && !checked.diagnostics?.length
          ? compareOutput(checked.output, expectedOutput)
          : undefined;
      const solved =
        !checked.error &&
        (checked.tests ?? []).every((t) => t.passed) &&
        (output?.passed ?? true);
      setCheck({ tests: checked.tests, output, solved });
      setReward(null);
      if (solved && activityId) {
        const result = await award.recordActivity(pathname, activityId);
        setReward(
          !result.ok
            ? result.reason === "signed-out"
              ? t("signInForXp")
              : null
            : result.xpAwarded > 0
              ? `+${result.xpAwarded} XP`
              : t("xpAlreadyEarned"),
        );
      }
    }
  }

  async function runPlain(withChecks: boolean) {
    const { result: pending, cancel } = runCode(code, {
      language,
      tests: withChecks ? tests : undefined,
      onLine: (line) => setLines((prev) => [...prev, line]),
      onStatus: (next, detail) => {
        setStatus(next);
        setInstalling(detail ?? "");
      },
    });
    cancelRef.current = cancel;
    const res = await pending;
    cancelRef.current = null;
    return { res, checked: res };
  }

  /**
   * Runs the code in the visible preview. Checks run in a separate hidden
   * copy of the page, so they can click around without changing the preview.
   */
  async function runPreview(page: string, withChecks: boolean) {
    previewRun.current?.dispose();
    const visible = runDom(code, {
      html: page,
      container: previewRef.current ?? undefined,
      onLine: (line) => setLines((prev) => [...prev, line]),
      storage: readPageStorage(),
      onStorage: savePageStorage,
      react,
    });
    previewRun.current = visible;
    const hidden =
      withChecks && canCheck
        ? runDom(code, { html: page, tests, react })
        : null;
    cancelRef.current = () => {
      visible.cancel();
      hidden?.cancel();
    };
    const [res, checked] = await Promise.all([visible.result, hidden?.result]);
    cancelRef.current = null;
    return { res, checked: checked ?? res };
  }

  function reset() {
    cancelRef.current?.();
    if (hasPreview) savePageStorage({});
    updateCode(starter);
    setLines([]);
    setResult(null);
    setCheck(null);
  }

  return (
    <div className={runnerFrameClass}>
      <RunnerToolbar
        language={language}
        canCheck={canCheck}
        running={running}
        onReset={reset}
        onRun={() => run(false)}
        onStop={() => cancelRef.current?.()}
        onCheck={() => run(true)}
      />

      <CodeEditor
        value={code}
        onChange={updateCode}
        language={language}
        onRun={() => run(canCheck)}
        minHeight={minHeight}
        diagnostics={result?.diagnostics}
        label={t("editorLabel")}
      />

      {hasPreview && <RunnerPreview ref={previewRef} />}

      {/* Output */}
      <OutputPanel
        tall={lines.some((line) => line.image)}
        status={
          running ? (
            <span className="flex items-center gap-1.5 normal-case">
              <Loader2 className="size-3 animate-spin" />{" "}
              {status === "loading"
                ? t("loading", { language: languageLabel[language] })
                : status === "installing"
                  ? t("installing", { packages: installing })
                  : t("running")}
            </span>
          ) : (
            result && (
              <span className="normal-case">
                {Math.round(result.durationMs)} ms
              </span>
            )
          )
        }
      >
        {lines.length > 0 ? (
          lines.map((line, i) =>
            line.image ? (
              // A data: URL chart from matplotlib; next/image can't help here.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={line.image}
                alt={t("chartAlt")}
                className="my-2 max-w-full rounded-lg bg-white"
              />
            ) : (
              <pre
                key={i}
                className={cn("whitespace-pre-wrap", lineStyle[line.level])}
              >
                {localizeRunnerText(line.text, t)}
              </pre>
            ),
          )
        ) : (
          <EmptyOutput>{result ? t("noOutput") : t("pressRun")}</EmptyOutput>
        )}
        {result?.error?.line && (
          <p className="mt-1 text-xs text-rose-300/80">
            {t("onLine", { line: result.error.line })}
          </p>
        )}
        {result?.notice && (
          <p className="mt-1 text-xs text-amber-200/80">
            {localizeRunnerText(result.notice, t)}
          </p>
        )}
      </OutputPanel>

      {/* Check results */}
      {check && (
        <div className="flex flex-col gap-2 border-t border-white/10 px-4 py-3">
          {check.solved ? (
            <p className="flex items-center gap-2 rounded-xl bg-neon-lime/12 px-3 py-2.5 font-semibold text-lime-200 ring-1 ring-neon-lime/40">
              <CheckCircle2 className="size-5" /> {t("solved")}
              {reward && (
                <span className="ml-auto text-sm font-medium text-amber-200">
                  {reward}
                </span>
              )}
            </p>
          ) : (
            <p className="flex items-center gap-2 font-semibold text-rose-200">
              <XCircle className="size-5" /> {t("notYet")}
            </p>
          )}
          {check.output && !check.output.passed && (
            <div className="rounded-xl bg-white/5 px-3 py-2 font-mono text-xs">
              <p className="mb-1 text-white/55">
                {t("outputMismatch", { line: check.output.line })}
              </p>
              <p className="text-lime-200">
                {t("expected")}: {check.output.expected ?? t("nothingMore")}
              </p>
              <p className="text-rose-200">
                {t("got")}: {check.output.got ?? t("nothing")}
              </p>
            </div>
          )}
          {check.tests && check.tests.length > 0 && (
            <ul className="flex flex-col gap-1">
              {check.tests.map((test) => (
                <li
                  key={test.name}
                  className="flex items-start gap-2 text-sm text-white/80"
                >
                  {test.passed ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-lime-300" />
                  ) : (
                    <XCircle className="mt-0.5 size-4 shrink-0 text-rose-300" />
                  )}
                  <span>
                    {test.name}
                    {test.error && (
                      <span className="block text-xs text-white/45">
                        {localizeRunnerText(test.error, t)}
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
