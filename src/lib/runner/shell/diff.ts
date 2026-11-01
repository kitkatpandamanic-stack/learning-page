/**
 * Line diffs for `git diff` / `git show` and the "1 file changed, 2
 * insertions(+)" summaries. Lesson files are small, so a plain
 * longest-common-subsequence table is fast enough; very large files fall
 * back to "everything changed".
 */

export type DiffLine = { op: " " | "-" | "+"; text: string };

const MAX_CELLS = 4_000_000;

/** Lines of a file; a final newline doesn't make an extra empty line. */
export function lines(text: string) {
  if (!text) return [];
  const all = text.split("\n");
  if (all.at(-1) === "") all.pop();
  return all;
}

export function diffLines(before: string, after: string): DiffLine[] {
  const a = lines(before);
  const b = lines(after);
  // Equal lines at the start and end need no table.
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head++;
  let tail = 0;
  while (
    tail < a.length - head &&
    tail < b.length - head &&
    a[a.length - 1 - tail] === b[b.length - 1 - tail]
  )
    tail++;
  const midA = a.slice(head, a.length - tail);
  const midB = b.slice(head, b.length - tail);
  const out: DiffLine[] = a.slice(0, head).map((text) => ({ op: " ", text }));

  if (midA.length * midB.length > MAX_CELLS) {
    out.push(...midA.map((text) => ({ op: "-" as const, text })));
    out.push(...midB.map((text) => ({ op: "+" as const, text })));
  } else {
    // table[i][j]: the longest common run of midA[i..] and midB[j..]
    const table = Array.from(
      { length: midA.length + 1 },
      () => new Uint32Array(midB.length + 1),
    );
    for (let i = midA.length - 1; i >= 0; i--)
      for (let j = midB.length - 1; j >= 0; j--)
        table[i][j] =
          midA[i] === midB[j]
            ? table[i + 1][j + 1] + 1
            : Math.max(table[i + 1][j], table[i][j + 1]);
    let i = 0;
    let j = 0;
    while (i < midA.length || j < midB.length) {
      if (i < midA.length && j < midB.length && midA[i] === midB[j]) {
        out.push({ op: " ", text: midA[i] });
        i++;
        j++;
      } else if (
        j < midB.length &&
        (i === midA.length || table[i][j + 1] > table[i + 1][j])
      ) {
        out.push({ op: "+", text: midB[j++] });
      } else {
        out.push({ op: "-", text: midA[i++] });
      }
    }
  }
  out.push(
    ...a.slice(a.length - tail).map((text) => ({ op: " " as const, text })),
  );
  return out;
}

export function countChanges(before: string, after: string) {
  let insertions = 0;
  let deletions = 0;
  for (const line of diffLines(before, after)) {
    if (line.op === "+") insertions++;
    if (line.op === "-") deletions++;
  }
  return { insertions, deletions };
}

/** Unified diff hunks ("@@ -1,2 +1,3 @@" …) with 3 lines of context. */
export function hunks(before: string, after: string, context = 3): string[] {
  const diff = diffLines(before, after);
  const out: string[] = [];
  let i = 0;
  while (i < diff.length) {
    if (diff[i].op === " ") {
      i++;
      continue;
    }
    // A hunk: from `context` lines before this change to `context` after the
    // last change that is within 2×context of the previous one.
    const start = Math.max(0, i - context);
    let end = i;
    let lastChange = i;
    while (end < diff.length) {
      if (diff[end].op !== " ") lastChange = end;
      else if (end - lastChange > context * 2) break;
      end++;
    }
    end = Math.min(diff.length, lastChange + context + 1);
    let oldStart = 1;
    let newStart = 1;
    for (const line of diff.slice(0, start)) {
      if (line.op !== "+") oldStart++;
      if (line.op !== "-") newStart++;
    }
    const body = diff.slice(start, end);
    const oldCount = body.filter((l) => l.op !== "+").length;
    const newCount = body.filter((l) => l.op !== "-").length;
    const range = (from: number, count: number) =>
      count === 1 ? `${from}` : `${count === 0 ? from - 1 : from},${count}`;
    // Like git, the nearest earlier line that starts with a letter, _ or $
    // (a function, a heading…) follows the @@, cut to 80 characters.
    const oldLines = diff.filter((l) => l.op !== "+").map((l) => l.text);
    let heading: string | undefined;
    for (let j = oldStart - 2; j >= 0 && !heading; j--)
      if (/^[A-Za-z_$]/.test(oldLines[j])) heading = oldLines[j];
    out.push(
      `@@ -${range(oldStart, oldCount)} +${range(newStart, newCount)} @@${heading ? ` ${heading.trimEnd().slice(0, 80)}` : ""}`,
    );
    for (const line of body) out.push(`${line.op}${line.text}`);
    i = end;
  }
  return out;
}
