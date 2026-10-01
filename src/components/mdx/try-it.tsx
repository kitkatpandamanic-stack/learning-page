import { LazyCodeRunner } from "@/components/code/lazy-code-runner";

/** An editable live demo: JavaScript running against a small HTML page. */
export function TryIt({ html, code }: { html: string; code: string }) {
  return (
    <div className="my-6">
      <LazyCodeRunner starter={code} html={html} autoRun minHeight="80px" />
    </div>
  );
}
