import "server-only";

import { reportIssue, type Report } from "@/lib/report-format";
import { siteConfig } from "@/lib/site";

/** A fine-grained token that can only create issues in the site's repository. */
export const reportsConfigured = Boolean(process.env.GITHUB_ISSUES_TOKEN);

const repo = new URL(siteConfig.githubUrl).pathname.replace(/^\//, "");

/** Opens a GitHub issue for the report, labelled "report". */
export async function fileReport(report: Report) {
  const { title, body } = reportIssue(report);
  const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${process.env.GITHUB_ISSUES_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ title, body, labels: ["report"] }),
  });
  if (!response.ok) {
    throw new Error(`GitHub issue failed: ${response.status}`);
  }
}
