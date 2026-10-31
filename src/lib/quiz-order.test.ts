import { describe, expect, it } from "vitest";

import { quizKey, quizOrder, shuffleQuiz } from "@/lib/quiz-order";

describe("quizOrder", () => {
  it("is a permutation of every option", () => {
    for (const count of [2, 3, 4, 5]) {
      const order = quizOrder(quizKey("python", "variables", 1), count);
      expect([...order].sort()).toEqual([...Array(count).keys()]);
    }
  });

  it("gives the same order for the same key, and EN and RU share the key", () => {
    const key = quizKey("javascript", "closures", 2);
    expect(quizOrder(key, 4)).toEqual(quizOrder(key, 4));
  });

  it("gives a new order on another round (Try again)", () => {
    const key = quizKey("sql", "inner-join", 1);
    const rounds = new Set(
      [0, 1, 2, 3, 4, 5].map((r) => quizOrder(key, 4, r).join()),
    );
    expect(rounds.size).toBeGreaterThan(1);
  });

  it("spreads the right answer over every position", () => {
    // Authors often put the right answer second; after shuffling, every
    // position should get a fair share.
    const counts = [0, 0, 0, 0];
    for (let n = 1; n <= 400; n++) {
      const quiz = shuffleQuiz(
        { options: ["a", "b", "c", "d"], answer: 1 },
        quizKey("typescript", `lesson-${n % 40}`, n),
      );
      counts[quiz.answer]++;
    }
    for (const c of counts) expect(c).toBeGreaterThan(60);
  });
});

describe("shuffleQuiz", () => {
  it("keeps the answer pointing at the same option", () => {
    const quiz = {
      question: "Which is a string?",
      options: ['"5"', "5", "true", "null"],
      answer: 0,
      explanation: "Quotes make text.",
    };
    const shuffled = shuffleQuiz(quiz, quizKey("python", "data-types", 1));
    expect(shuffled.options[shuffled.answer]).toBe('"5"');
    expect([...shuffled.options].sort()).toEqual([...quiz.options].sort());
    expect(shuffled.question).toBe(quiz.question);
    expect(shuffled.explanation).toBe(quiz.explanation);
  });
});
