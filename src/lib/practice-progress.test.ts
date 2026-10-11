import { describe, expect, it } from "vitest";

import { summarizePractice } from "@/lib/practice-progress";

const p = (
  slug: string,
  difficulty: "easy" | "medium" | "hard",
  topic: string,
) => ({
  permalink: `/practice/python/${slug}`,
  title: slug,
  difficulty,
  topic,
});
const problems = [
  p("a", "easy", "strings"),
  p("b", "easy", "lists"),
  p("c", "easy", "strings"),
  p("d", "medium", "lists"),
  p("e", "medium", "math"),
  p("f", "hard", "strings"),
];
const solved = (...slugs: string[]) =>
  new Set(slugs.map((s) => `/practice/python/${s}`));

describe("practice progress", () => {
  it("counts solved problems by difficulty and topic", () => {
    const s = summarizePractice(problems, solved("a", "c", "d"));
    expect(s.solved).toBe(3);
    expect(s.total).toBe(6);
    expect(s.difficulty).toEqual({
      easy: { solved: 2, total: 3 },
      medium: { solved: 1, total: 2 },
      hard: { solved: 0, total: 1 },
    });
    expect(s.topics).toEqual([
      { topic: "strings", solved: 2, total: 3 },
      { topic: "lists", solved: 1, total: 2 },
      { topic: "math", solved: 0, total: 1 },
    ]);
  });

  it("suggests the easiest problem in the topic done least", () => {
    const s = summarizePractice(problems, solved("a", "c", "b"));
    expect(s.focusTopic).toBe("math");
    expect(s.next?.title).toBe("e");
  });

  it("between equally done topics, picks the one with the easier problem", () => {
    const s = summarizePractice(
      [
        p("a", "easy", "strings"),
        p("m", "medium", "math"),
        p("l", "easy", "lists"),
      ],
      solved("a"),
    );
    expect(s.focusTopic).toBe("lists");
    expect(s.next?.title).toBe("l");
  });

  it("starts beginners at the first problem, and is done when all are solved", () => {
    expect(summarizePractice(problems, solved()).next?.title).toBe("a");
    expect(summarizePractice(problems, solved()).focusTopic).toBeNull();
    const all = summarizePractice(
      problems,
      solved("a", "b", "c", "d", "e", "f"),
    );
    expect(all.next).toBeNull();
  });
});
