/**
 * "Report a problem" on lessons and practice problems: what learners can pick,
 * and the GitHub issue a report becomes. No server imports, so it's testable.
 */

export const reportCategories = [
  "typo",
  "wrong",
  "check",
  "broken",
  "other",
] as const;
export type ReportCategory = (typeof reportCategories)[number];

export const MESSAGE_MIN = 5;
export const MESSAGE_MAX = 2000;

const categoryNames: Record<ReportCategory, string> = {
  typo: "Typo or unclear wording",
  wrong: "Something in the explanation is wrong",
  check: "The check rejects a right answer (or accepts a wrong one)",
  broken: "The page or the editor doesn't work",
  other: "Something else",
};

export type Report = {
  category: ReportCategory;
  message: string;
  page: { title: string; permalink: string; url: string };
  locale: string;
  signedIn: boolean;
};

export function isReportCategory(value: unknown): value is ReportCategory {
  return reportCategories.includes(value as ReportCategory);
}

/**
 * The issue's title and body. The learner's words go in a code block, so they
 * can't @mention people, add images or links, or break the layout.
 */
export function reportIssue(report: Report) {
  const message = report.message
    .trim()
    .slice(0, MESSAGE_MAX)
    .replace(/`{3,}/g, "ʼʼʼ");
  const title = `Report: ${report.page.title} (${report.category})`.slice(
    0,
    200,
  );
  const body = [
    `**Page:** [${report.page.title.replace(/[[\]]/g, "")}](${report.page.url}) · \`${report.page.permalink}\` · ${report.locale.toUpperCase()}`,
    `**Problem:** ${categoryNames[report.category]}`,
    `**From:** ${report.signedIn ? "a signed-in learner" : "a guest"}`,
    "",
    "```text",
    message,
    "```",
    "",
    "_Sent with the “Report a problem” button on PandaDev._",
  ].join("\n");
  return { title, body };
}
