import { describe, expect, it } from "vitest";

import { isReportCategory, reportIssue } from "@/lib/report-format";

const report = {
  category: "check" as const,
  message: "My answer `x = 1` is right but the check fails",
  page: {
    title: "Count the vowels",
    permalink: "/practice/python/count-vowels",
    url: "https://pandadev.test/ru/practice/python/count-vowels",
  },
  locale: "ru",
  signedIn: false,
};

describe("report issues", () => {
  it("names the page, the problem and the language", () => {
    const { title, body } = reportIssue(report);
    expect(title).toBe("Report: Count the vowels (check)");
    expect(body).toContain(
      "[Count the vowels](https://pandadev.test/ru/practice/python/count-vowels)",
    );
    expect(body).toContain("`/practice/python/count-vowels` · RU");
    expect(body).toContain("The check rejects a right answer");
    expect(body).toContain("a guest");
  });

  it("keeps the learner's words inside a code block", () => {
    const { body } = reportIssue({
      ...report,
      message: "@someone look ```\n# heading\n``` ![x](http://e.vil/x.png)",
    });
    const block = body.slice(body.indexOf("```text"));
    expect(block.match(/```/g)).toHaveLength(2);
    expect(block).toContain("@someone");
  });

  it("only accepts known categories", () => {
    expect(isReportCategory("typo")).toBe(true);
    expect(isReportCategory("spam")).toBe(false);
  });
});
