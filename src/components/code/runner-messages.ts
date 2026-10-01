import type { useTranslations } from "next-intl";

type T = ReturnType<typeof useTranslations<"runner">>;

/**
 * The code runners report in English. This translates the messages they write
 * themselves; errors from JavaScript, Python and the TypeScript compiler stay
 * in English, as learners will see them in real tools.
 */
const rules: [RegExp, (t: T, m: RegExpExecArray) => string][] = [
  [
    /^Stopped after (\d+) seconds\. Is there an infinite loop\?$/,
    (t, m) => t("stoppedAfter", { seconds: Number(m[1]) }),
  ],
  [/^Stopped\.$/, (t) => t("stopped")],
  [
    /^(\d+) type errors?\. Fix (?:it|them) to run your code\.$/,
    (t, m) => t("typeErrors", { count: Number(m[1]) }),
  ],
  [
    /^Line (\d+): ([\s\S]*)$/,
    (t, m) => t("line", { line: Number(m[1]), message: m[2] }),
  ],
  [/^Fix the type errors first\.$/, (t) => t("fixTypeErrors")],
  [/^Fix the error in your code first\.$/, (t) => t("fixErrorFirst")],
  [/^Your code didn't finish\.$/, (t) => t("didNotFinish")],
  [/^Your code stopped early/, (t) => t("stoppedEarly")],
  [
    /^Output stopped after (\d+) lines\.$/,
    (t, m) => t("outputStopped", { count: Number(m[1]) }),
  ],
  [/^Python was restarted\./, (t) => t("pythonRestarted")],
  [/^Python took too long to load\./, (t) => t("pythonSlow")],
  [
    /^Python couldn't load: ([\s\S]*)$/,
    (t, m) => t("pythonFailed", { error: m[1] }),
  ],
  [/^Couldn't load the TypeScript checker/, (t) => t("tsUnavailable")],
  [
    /^RangeError: Stopped a loop that ran for over 2 seconds\./,
    (t) => `RangeError: ${t("loopStopped")}`,
  ],
  [
    /^RuntimeError: input\(\) isn't supported here yet\./,
    (t) => `RuntimeError: ${t("noInput")}`,
  ],
  [/^The code runner crashed\.$/, (t) => t("crashed")],
];

export function localizeRunnerText(text: string | undefined, t: T) {
  if (!text) return text;
  for (const [pattern, render] of rules) {
    const match = pattern.exec(text);
    if (match) return render(t, match);
  }
  return text;
}
