"use client";

import { ReviewSession } from "@/components/learning/review-session";
import type { ReviewQuestion } from "@/lib/learning";

const questions: ReviewQuestion[] = [
  {
    ref: "/learn/python/for-loops#quiz-1",
    question: "How many times does this loop run? for i in range(3):",
    options: ["2", "3", "4"],
    answer: 1,
    explanation:
      "range(3) gives 0, 1 and 2: three numbers, so three iterations.",
    lessonTitle: "for loops",
    lessonHref: "/learn/python/for-loops",
    language: "python",
    isNew: false,
  },
  {
    ref: "/learn/sql/outer-joins#quiz-1",
    question: "Which join keeps every customer, even those without orders?",
    options: ["INNER JOIN", "LEFT JOIN from customers", "CROSS JOIN"],
    answer: 1,
    lessonTitle: "Outer joins and missing rows",
    lessonHref: "/learn/sql/outer-joins",
    language: "sql",
    isNew: true,
  },
];

/** Daily review with sample questions, graded in the browser (design page only). */
export function ReviewDemo() {
  return (
    <ReviewSession
      questions={questions}
      waiting={2}
      dueTomorrow={3}
      submit={async (ref, choice) => {
        const answer = questions.find((q) => q.ref === ref)!.answer;
        const last = ref === questions.at(-1)!.ref;
        return {
          ok: true,
          correct: choice === answer,
          answer,
          finished: last,
          xpAwarded: last ? 15 : 0,
          totalXp: 0,
          level: 1,
          leveledUp: false,
          newAchievements: [],
        };
      }}
    />
  );
}
