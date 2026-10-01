import type { ReactNode } from "react";
import { Terminal } from "lucide-react";

/** A code block followed by the output it prints. */
export function CodeExample({
  output,
  children,
}: {
  /** What the code prints; use \n for several lines */
  output: string;
  children: ReactNode;
}) {
  return (
    <div className="code-example my-6">
      {children}
      <div className="not-prose -mt-2 rounded-b-2xl border border-t-0 border-white/10 bg-black/40 px-4 pt-4 pb-3">
        <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-white/45 uppercase">
          <Terminal className="size-3.5" /> Output
        </p>
        <pre className="font-mono text-sm whitespace-pre-wrap text-amber-200">
          {output}
        </pre>
      </div>
    </div>
  );
}
