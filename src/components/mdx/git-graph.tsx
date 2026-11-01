import { CommitGraphView } from "@/components/code/commit-graph";
import { executeShell } from "@/lib/runner/execute-shell";

/**
 * A commit graph in a lesson: `setup` runs in the practice terminal when the
 * page is built, and the repository it ends in is drawn, as under a run.
 */
export async function GitGraph({
  setup,
  caption,
}: {
  /** Terminal commands that make the repository (one per line) */
  setup: string;
  /** A sentence under the picture */
  caption?: string;
}) {
  const { graph } = await executeShell("", { setup });
  if (!graph) return null;
  return (
    <div className="not-prose my-6 overflow-hidden rounded-2xl border border-white/10 bg-black/30 [&>figure]:border-t-0">
      <CommitGraphView graph={graph} />
      {caption && <p className="px-4 pb-3 text-sm text-white/70">{caption}</p>}
    </div>
  );
}
