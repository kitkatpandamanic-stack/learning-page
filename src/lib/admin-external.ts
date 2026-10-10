import "server-only";

import { siteConfig } from "@/lib/site";
import { CHANNEL, telegram, telegramConfigured } from "@/lib/telegram/api";

/**
 * Admin panel data from outside the database: "Report a problem" issues and
 * scheduled job runs on GitHub, and the Telegram channel's size. Each part
 * fails on its own (null) so one outage doesn't break the page.
 */

const repo = new URL(siteConfig.githubUrl).pathname.replace(/^\//, "");

async function github<T>(path: string): Promise<T | null> {
  try {
    const token = process.env.GITHUB_ISSUES_TOKEN;
    const response = await fetch(
      `https://api.github.com/repos/${repo}${path}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        next: { revalidate: 300 },
      },
    );
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

export type Report = {
  number: number;
  title: string;
  url: string;
  state: "open" | "closed";
  createdAt: string;
};

/** The latest reports, open ones first. */
export async function getReports(): Promise<Report[] | null> {
  const issues = await github<
    {
      number: number;
      title: string;
      html_url: string;
      state: "open" | "closed";
      created_at: string;
      pull_request?: unknown;
    }[]
  >("/issues?labels=report&state=all&per_page=30&sort=created");
  if (!issues) return null;
  return issues
    .filter((i) => !i.pull_request)
    .map((i) => ({
      number: i.number,
      title: i.title.replace(/^Report: /, ""),
      url: i.html_url,
      state: i.state,
      createdAt: i.created_at,
    }))
    .sort((a, b) => (a.state === b.state ? 0 : a.state === "open" ? -1 : 1));
}

export type JobRun = {
  createdAt: string;
  conclusion: string | null;
  status: string;
  url: string;
  event: string;
};

/** Recent runs of a GitHub Actions workflow, newest first. */
export async function getJobRuns(workflow: string): Promise<JobRun[] | null> {
  const data = await github<{
    workflow_runs: {
      created_at: string;
      conclusion: string | null;
      status: string;
      html_url: string;
      event: string;
    }[];
  }>(`/actions/workflows/${workflow}/runs?per_page=6`);
  if (!data) return null;
  return data.workflow_runs.map((r) => ({
    createdAt: r.created_at,
    conclusion: r.conclusion,
    status: r.status,
    url: r.html_url,
    event: r.event,
  }));
}

/** How many people follow the Telegram channel. */
export async function getChannelMembers() {
  if (!telegramConfigured) return null;
  try {
    return await telegram<number>("getChatMemberCount", { chat_id: CHANNEL });
  } catch {
    return null;
  }
}
