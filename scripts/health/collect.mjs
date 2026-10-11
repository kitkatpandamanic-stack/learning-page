// The health collector: asks Vercel, Neon, Sentry and GitHub how PandaDev is
// doing and sends the numbers to the site (/api/health/ingest), where
// /admin/health shows them. It runs on GitHub (.github/workflows/health.yml),
// so the tokens for those services never reach the website itself.
//
//   node scripts/health/collect.mjs           collect and send
//   node scripts/health/collect.mjs --print   collect and print instead
//
// Each part works on its own: a missing token or an outage marks that part
// as failed and the rest still goes through. No token is ever printed.
import { loadEnv, SITE } from "../telegram/lib.mjs";

loadEnv();
const print = process.argv.includes("--print");
const env = process.env;

async function getJson(url, headers) {
  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function collect(name, needs, read) {
  const missing = needs.filter((key) => !env[key]);
  if (missing.length)
    return { ok: false, error: `not set up (${missing.join(", ")})` };
  try {
    return { ok: true, ...(await read()) };
  } catch (error) {
    // Only our own short messages: never a response body or a token.
    const message = error instanceof Error ? error.message : "failed";
    console.error(`✗ ${name}: ${message}`);
    return { ok: false, error: message.slice(0, 120) };
  }
}

const iso = (ms) =>
  typeof ms === "number" ? new Date(ms).toISOString() : null;

const vercel = collect(
  "vercel",
  ["VERCEL_TOKEN", "VERCEL_PROJECT_ID"],
  async () => {
    const headers = { Authorization: `Bearer ${env.VERCEL_TOKEN}` };
    const team = env.VERCEL_ORG_ID?.startsWith("team_")
      ? `teamId=${env.VERCEL_ORG_ID}`
      : "";
    const project = encodeURIComponent(env.VERCEL_PROJECT_ID);
    const [deployments, envs] = await Promise.all([
      getJson(
        `https://api.vercel.com/v6/deployments?projectId=${project}&limit=100&${team}`,
        headers,
      ),
      getJson(
        `https://api.vercel.com/v10/projects/${project}/env?${team}`,
        headers,
      ),
    ]);
    return {
      deployments: deployments.deployments.map((d) => ({
        state: d.state ?? d.readyState ?? "",
        target: d.target ?? null,
        createdAt: iso(d.created ?? d.createdAt),
      })),
      // Names and dates only: values stay on Vercel.
      env: envs.envs.map((e) => ({
        key: e.key,
        updatedAt: iso(e.updatedAt ?? e.createdAt),
        targets: Array.isArray(e.target)
          ? e.target
          : [e.target].filter(Boolean),
      })),
    };
  },
);

const neon = collect("neon", ["NEON_API_KEY", "NEON_PROJECT_ID"], async () => {
  const { project } = await getJson(
    `https://console.neon.tech/api/v2/projects/${encodeURIComponent(env.NEON_PROJECT_ID)}`,
    { Authorization: `Bearer ${env.NEON_API_KEY}`, Accept: "application/json" },
  );
  return {
    computeSeconds: project.compute_time_seconds ?? 0,
    activeSeconds: project.active_time_seconds ?? 0,
    transferBytes: project.data_transfer_bytes ?? 0,
    storageBytes: project.synthetic_storage_size ?? 0,
    periodStart: project.consumption_period_start ?? null,
    periodEnd: project.consumption_period_end ?? null,
  };
});

const sentry = collect(
  "sentry",
  ["SENTRY_READ_TOKEN", "SENTRY_ORG", "SENTRY_PROJECT"],
  async () => {
    const api = env.SENTRY_API || "https://sentry.io";
    const query = encodeURIComponent("is:unresolved lastSeen:-24h");
    const issues = await getJson(
      `${api}/api/0/projects/${env.SENTRY_ORG}/${env.SENTRY_PROJECT}/issues/?query=${query}&statsPeriod=24h&sort=freq&limit=25`,
      { Authorization: `Bearer ${env.SENTRY_READ_TOKEN}` },
    );
    const dayAgo = Date.now() - 86_400_000;
    const last24h = (issue) =>
      (issue.stats?.["24h"] ?? []).reduce((sum, [, n]) => sum + n, 0);
    return {
      events24h: issues.reduce((sum, i) => sum + last24h(i), 0),
      newIssues24h: issues.filter((i) => Date.parse(i.firstSeen) > dayAgo)
        .length,
      issues: issues.slice(0, 5).map((i) => ({
        title: i.title,
        culprit: i.culprit ?? "",
        level: i.level,
        count: last24h(i),
        users: i.userCount ?? 0,
        firstSeen: i.firstSeen,
        lastSeen: i.lastSeen,
        link: i.permalink,
      })),
    };
  },
);

const github = collect(
  "github",
  ["GITHUB_TOKEN", "GITHUB_REPOSITORY"],
  async () => {
    const headers = {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    const repo = `https://api.github.com/repos/${env.GITHUB_REPOSITORY}`;
    // GitHub's workflow token can't read Dependabot alerts: that takes a
    // fine-grained token with only "Dependabot alerts: read" (HEALTH_GITHUB_TOKEN).
    const res = await fetch(
      `${repo}/dependabot/alerts?state=open&per_page=100`,
      {
        headers: {
          ...headers,
          Authorization: `Bearer ${env.HEALTH_GITHUB_TOKEN || env.GITHUB_TOKEN}`,
        },
        signal: AbortSignal.timeout(20_000),
      },
    ).catch(() => null);
    let dependabot = null;
    let dependabotStatus = "failed";
    if (res?.ok) {
      dependabot = { critical: 0, high: 0, medium: 0, low: 0 };
      for (const a of await res.json()) {
        const severity =
          a.security_vulnerability?.severity ?? a.security_advisory?.severity;
        if (severity in dependabot) dependabot[severity] += 1;
      }
      dependabotStatus = "ok";
    } else if (res) {
      const { message = "" } = await res.json().catch(() => ({}));
      dependabotStatus = /disabled/i.test(message)
        ? "off"
        : [401, 403, 404].includes(res.status)
          ? "no-access"
          : "failed";
    }
    // 404 until code scanning (CodeQL) is set up.
    const codeScanning = await getJson(
      `${repo}/code-scanning/alerts?state=open&per_page=100`,
      headers,
    )
      .then((alerts) => alerts.length)
      .catch(() => null);
    return { dependabot, dependabotStatus, codeScanning };
  },
);

const snapshot = {
  version: 1,
  vercel: await vercel,
  neon: await neon,
  sentry: await sentry,
  github: await github,
};

if (print) {
  console.log(JSON.stringify(snapshot, null, 2));
} else {
  if (!env.CRON_SECRET) throw new Error("CRON_SECRET is not set");
  const res = await fetch(`${SITE}/api/health/ingest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CRON_SECRET}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(snapshot),
  });
  if (!res.ok) throw new Error(`${SITE}/api/health/ingest: HTTP ${res.status}`);
  for (const [name, part] of Object.entries(snapshot)) {
    if (name !== "version")
      console.log(
        `${part.ok ? "✓" : "✗"} ${name}${part.ok ? "" : `: ${part.error}`}`,
      );
  }
}
