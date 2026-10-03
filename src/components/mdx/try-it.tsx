import { LazyCodeRunner } from "@/components/code/lazy-code-runner";
import type { RunLanguage } from "@/lib/runner/execute";

/**
 * An editable live demo: JavaScript running against a small HTML page, a
 * React component (`language="react"`), or, without `html`, code the learner
 * runs themselves (e.g. Python that draws a chart, which a static
 * CodeExample can't show).
 */
export function TryIt({
  html,
  code,
  language = "javascript",
}: {
  html?: string;
  code: string;
  language?: RunLanguage;
}) {
  return (
    <div className="my-6">
      {html !== undefined || language === "react" ? (
        <LazyCodeRunner
          starter={code}
          html={html}
          language={language}
          autoRun
          minHeight="80px"
        />
      ) : (
        <LazyCodeRunner starter={code} language={language} minHeight="80px" />
      )}
    </div>
  );
}
