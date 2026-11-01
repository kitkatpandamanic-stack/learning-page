/**
 * The commit graph drawn under the terminal output: every commit reachable
 * from a branch, a tag or HEAD, newest first, each in a lane (a column) so
 * branches sit side by side and merges join them, like `git log --graph`.
 */
import "./buffer-global";

import * as git from "isomorphic-git";

import type { GitSandbox } from "./git";

export type GraphLabel = { name: string; kind: "head" | "branch" | "tag" };

export type GraphCommit = {
  hash: string;
  short: string;
  message: string;
  /** Column, from 0 on the left */
  lane: number;
  labels: GraphLabel[];
  /** True for the commit HEAD points at */
  head: boolean;
};

/**
 * A line from a commit (row `from`) down to one of its parents (row `to`, or
 * past the bottom when the parent isn't shown). It leaves the commit's lane
 * into `lane`, runs down it, and bends into the parent's lane at the end.
 */
export type GraphEdge = {
  from: number;
  to: number | null;
  fromLane: number;
  lane: number;
  toLane: number;
};

export type CommitGraph = {
  commits: GraphCommit[];
  edges: GraphEdge[];
  lanes: number;
  /** Older commits left out of the picture */
  more: number;
  /** The current branch, or null when HEAD is detached */
  branch: string | null;
};

/** At most this many commits are drawn (the newest). */
export const GRAPH_MAX_COMMITS = 24;
/** Repositories bigger than this aren't read past it. */
const WALK_LIMIT = 500;

type Node = {
  oid: string;
  parents: string[];
  message: string;
  time: number;
};

/** The graph of the repository at `dir`, or null when it has no commits yet. */
export async function commitGraph(
  sandbox: GitSandbox,
  dir: string,
  max = GRAPH_MAX_COMMITS,
): Promise<CommitGraph | null> {
  const fs = sandbox.fs;
  const branch = await sandbox.branch(dir);
  const head = await sandbox.head(dir);

  const labels = new Map<string, GraphLabel[]>();
  const label = (oid: string, l: GraphLabel) =>
    labels.set(oid, [...(labels.get(oid) ?? []), l]);
  const tips: string[] = [];
  if (head) {
    tips.push(head);
    if (!branch) label(head, { name: "HEAD", kind: "head" });
  }
  for (const name of await sandbox.branches(dir)) {
    const oid = await sandbox.resolveCommit(dir, name);
    if (!oid) continue;
    tips.push(oid);
    label(oid, { name, kind: name === branch ? "head" : "branch" });
  }
  for (const tag of await git.listTags({ fs, dir })) {
    const oid = await sandbox.resolveCommit(dir, tag);
    if (!oid) continue;
    tips.push(oid);
    label(oid, { name: tag, kind: "tag" });
  }
  // A merge stopped on conflicts: show the branch coming in.
  const merging = sandbox.merging(dir);
  if (merging) tips.push(merging.theirs);
  if (!tips.length) return null;

  const nodes = new Map<string, Node>();
  const queue = [...tips];
  while (queue.length && nodes.size < WALK_LIMIT) {
    const oid = queue.pop()!;
    if (nodes.has(oid)) continue;
    let commit;
    try {
      ({ commit } = await git.readCommit({ fs, dir, oid }));
    } catch {
      continue;
    }
    nodes.set(oid, {
      oid,
      parents: commit.parent,
      message: commit.message.split("\n")[0],
      time: commit.committer.timestamp,
    });
    queue.push(...commit.parent);
  }

  const ordered = topoOrder(nodes);
  const shown = ordered.slice(0, max);
  const row = new Map(shown.map((n, i) => [n.oid, i]));
  const { lanes, edges } = layout(shown, row);
  return {
    commits: shown.map((n, i) => ({
      hash: n.oid,
      short: n.oid.slice(0, 7),
      message: n.message,
      lane: lanes[i],
      labels: sortLabels(labels.get(n.oid) ?? []),
      head: n.oid === head,
    })),
    edges,
    lanes: Math.max(
      1,
      ...lanes.map((l) => l + 1),
      ...edges.map((e) => e.lane + 1),
    ),
    more: ordered.length - shown.length,
    branch,
  };
}

/** Newest first, and never a parent before its child. */
function topoOrder(nodes: Map<string, Node>): Node[] {
  const children = new Map<string, number>();
  for (const n of nodes.values())
    for (const p of n.parents)
      if (nodes.has(p)) children.set(p, (children.get(p) ?? 0) + 1);
  const newest = (a: Node, b: Node) =>
    b.time - a.time || (a.oid < b.oid ? -1 : 1);
  const ready = [...nodes.values()].filter((n) => !children.get(n.oid));
  const out: Node[] = [];
  while (ready.length) {
    ready.sort(newest);
    const n = ready.shift()!;
    out.push(n);
    for (const p of n.parents) {
      if (!nodes.has(p)) continue;
      const left = children.get(p)! - 1;
      children.set(p, left);
      if (left === 0) ready.push(nodes.get(p)!);
    }
  }
  return out;
}

/**
 * Gives each commit a lane. Going down the rows, each lane waits for one
 * commit (a parent of something above). A commit takes the first lane
 * waiting for it, or a free one, and the other lanes waiting for it end
 * there; its first parent then keeps that lane, and other parents (a merge)
 * wait in lanes of their own.
 */
function layout(nodes: Node[], row: Map<string, number>) {
  const waiting: (string | null)[] = [];
  const lanes: number[] = [];
  // Edges whose parent row isn't known until we reach it.
  const open: { from: number; fromLane: number; lane: number; oid: string }[] =
    [];
  const edges: GraphEdge[] = [];
  const free = () => {
    const i = waiting.indexOf(null);
    return i === -1 ? waiting.length : i;
  };

  nodes.forEach((node, i) => {
    let lane = waiting.indexOf(node.oid);
    if (lane === -1) lane = free();
    lanes.push(lane);
    // Every lane waiting for this commit ends here.
    for (let l = 0; l < waiting.length; l++)
      if (waiting[l] === node.oid) waiting[l] = null;
    for (let e = open.length - 1; e >= 0; e--) {
      if (open[e].oid !== node.oid) continue;
      const { from, fromLane, lane: through } = open[e];
      edges.push({ from, to: i, fromLane, lane: through, toLane: lane });
      open.splice(e, 1);
    }

    node.parents.forEach((parent, p) => {
      // The first parent keeps this lane, until its lines meet. A merge's
      // other parent joins a lane already waiting for it, or a new one.
      let through = p === 0 ? lane : waiting.indexOf(parent);
      if (through === -1) through = free();
      waiting[through] = parent;
      if (row.has(parent))
        open.push({ from: i, fromLane: lane, lane: through, oid: parent });
      else
        edges.push({
          from: i,
          to: null,
          fromLane: lane,
          lane: through,
          toLane: through,
        });
    });
  });
  return { lanes, edges };
}

const kindOrder = { head: 0, branch: 1, tag: 2 };

function sortLabels(labels: GraphLabel[]) {
  return labels.sort(
    (a, b) =>
      kindOrder[a.kind] - kindOrder[b.kind] || a.name.localeCompare(b.name),
  );
}
