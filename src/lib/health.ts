/**
 * The judgement behind /admin/health: turns raw numbers (from the database
 * and from the health collector's snapshot) into green / yellow / red, with
 * a list of findings saying why. Pure, so it's easy to test.
 */

export type Status = "ok" | "warn" | "bad" | "unknown";

/** A reason for a status; `code` picks the message in messages/<locale>/health.json. */
export type Finding = {
  status: Exclude<Status, "ok" | "unknown">;
  code: string;
  values?: Record<string, string | number>;
};

export type Area = { status: Status; findings: Finding[] };

/**
 * Free plan limits (checked 2026-10-11). Vercel Hobby: 10 GB of deployment
 * storage; Neon Free: 100 CU-hours of compute a month, 1 GB of storage and
 * 5 GB of data transfer per project.
 */
export const FREE_LIMITS = {
  vercelStorageBytes: 10 * 1024 ** 3,
  /** One deployment of the site (measured with `next build`): about 1.1 GB */
  deploymentBytes: 1.1 * 1024 ** 3,
  neonComputeHours: 100,
  neonStorageBytes: 1024 ** 3,
  neonTransferBytes: 5 * 1024 ** 3,
};

const RANK: Record<Status, number> = { ok: 0, unknown: 1, warn: 2, bad: 3 };

/** The worst of some statuses; "unknown" only wins when nothing is known. */
export function worst(statuses: Status[]): Status {
  const known = statuses.filter((s) => s !== "unknown");
  if (known.length === 0) return "unknown";
  return known.reduce((a, b) => (RANK[b] > RANK[a] ? b : a), "ok" as Status);
}

export function area(findings: Finding[], known = true): Area {
  if (!known) return { status: "unknown", findings };
  return { status: worst(["ok", ...findings.map((f) => f.status)]), findings };
}

/** Green below 70% of a limit, yellow from 70%, red from 90%. */
export function meterStatus(used: number, limit: number): Status {
  const ratio = limit > 0 ? used / limit : 0;
  return ratio >= 0.9 ? "bad" : ratio >= 0.7 ? "warn" : "ok";
}

/**
 * Where usage will end the period at the current pace, or null in the
 * period's first day (too early to tell).
 */
export function projectUsage(
  used: number,
  start: Date,
  end: Date,
  now = new Date(),
) {
  const elapsed = now.getTime() - start.getTime();
  const length = end.getTime() - start.getTime();
  if (elapsed < 86_400_000 || length <= 0) return null;
  return used * Math.max(1, length / Math.min(elapsed, length));
}

/** The calendar month (UTC) around `now`, for usage that resets monthly. */
export function monthAround(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );
  return { start, end };
}

// ── Learner signals ─────────────────────────────────────────────────────────

export type SignalKind = "zero" | "low" | "spike";

/**
 * The last 24 hours against a normal day (the average of the 14 days
 * before). Nothing on a day that's usually busy often means something is
 * broken (sign-in, saving progress) even though the site is up.
 */
export function compareToNormal(
  last24h: number,
  dailyAverage: number,
): { status: Status; kind?: SignalKind } {
  if (last24h === 0 && dailyAverage >= 2)
    return { status: "bad", kind: "zero" };
  if (dailyAverage >= 5 && last24h < dailyAverage * 0.4)
    return { status: "warn", kind: "low" };
  if (last24h >= 20 && last24h > dailyAverage * 3)
    return { status: "warn", kind: "spike" };
  return { status: "ok" };
}

// ── The collector's snapshot ─────────────────────────────────────────────────

type Part<T> = ({ ok: true } & T) | { ok: false; error: string };

export type Snapshot = {
  version: 1;
  vercel?: Part<{
    deployments: { state: string; target: string | null; createdAt: string }[];
    env: { key: string; updatedAt: string; targets: string[] }[];
  }>;
  neon?: Part<{
    computeSeconds: number;
    activeSeconds: number;
    transferBytes: number;
    storageBytes: number;
    periodStart: string | null;
    periodEnd: string | null;
  }>;
  sentry?: Part<{
    events24h: number;
    newIssues24h: number;
    issues: {
      title: string;
      culprit: string;
      level: string;
      count: number;
      users: number;
      firstSeen: string;
      lastSeen: string;
      link: string;
    }[];
  }>;
  github?: Part<{
    dependabot: Record<"critical" | "high" | "medium" | "low", number> | null;
    /** Why there are no counts: alerts turned off, or no key that may read them */
    dependabotStatus: "ok" | "off" | "no-access" | "failed";
    codeScanning: number | null;
  }>;
};

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : 0);
const str = (v: unknown, max = 300) =>
  typeof v === "string" ? v.slice(0, max) : "";
const date = (v: unknown) =>
  typeof v === "string" && !isNaN(Date.parse(v)) ? v : null;
const list = (v: unknown, max: number) =>
  Array.isArray(v) ? v.filter(isObject).slice(0, max) : [];

function part<T>(
  v: unknown,
  read: (o: Record<string, unknown>) => T,
): Part<T> | undefined {
  if (!isObject(v)) return undefined;
  if (v.ok !== true) return { ok: false, error: str(v.error, 200) || "failed" };
  return { ok: true, ...read(v) };
}

/**
 * Reads a snapshot defensively: anything missing or of the wrong type is
 * dropped or zeroed, so the page never trusts the collector's JSON blindly.
 * Returns null for something that isn't a version 1 snapshot at all.
 */
export function readSnapshot(data: unknown): Snapshot | null {
  if (!isObject(data) || data.version !== 1) return null;
  return {
    version: 1,
    vercel: part(data.vercel, (o) => ({
      deployments: list(o.deployments, 100).map((d) => ({
        state: str(d.state, 20),
        target: typeof d.target === "string" ? str(d.target, 20) : null,
        createdAt: date(d.createdAt) ?? new Date(0).toISOString(),
      })),
      env: list(o.env, 100).map((e) => ({
        key: str(e.key, 100),
        updatedAt: date(e.updatedAt) ?? new Date(0).toISOString(),
        targets: Array.isArray(e.targets)
          ? e.targets.filter((t): t is string => typeof t === "string")
          : [],
      })),
    })),
    neon: part(data.neon, (o) => ({
      computeSeconds: num(o.computeSeconds),
      activeSeconds: num(o.activeSeconds),
      transferBytes: num(o.transferBytes),
      storageBytes: num(o.storageBytes),
      periodStart: date(o.periodStart),
      periodEnd: date(o.periodEnd),
    })),
    sentry: part(data.sentry, (o) => ({
      events24h: num(o.events24h),
      newIssues24h: num(o.newIssues24h),
      issues: list(o.issues, 10).map((i) => ({
        title: str(i.title),
        culprit: str(i.culprit),
        level: str(i.level, 20),
        count: num(i.count),
        users: num(i.users),
        firstSeen: date(i.firstSeen) ?? new Date(0).toISOString(),
        lastSeen: date(i.lastSeen) ?? new Date(0).toISOString(),
        // Only links into Sentry itself
        link: /^https:\/\/([a-z0-9-]+\.)*sentry\.io\//.test(str(i.link))
          ? str(i.link)
          : "",
      })),
    })),
    github: part(data.github, (o) => ({
      dependabot: isObject(o.dependabot)
        ? {
            critical: num(o.dependabot.critical),
            high: num(o.dependabot.high),
            medium: num(o.dependabot.medium),
            low: num(o.dependabot.low),
          }
        : null,
      dependabotStatus:
        (["ok", "off", "no-access"] as const).find(
          (v) => v === o.dependabotStatus,
        ) ?? (isObject(o.dependabot) ? "ok" : "failed"),
      codeScanning: typeof o.codeScanning === "number" ? o.codeScanning : null,
    })),
  };
}

// ── Areas ────────────────────────────────────────────────────────────────────

/** The collector says "not set up (…)" for parts whose token isn't added yet. */
export const notSetUp = (error: string) => error.startsWith("not set up");

const HOUR = 3_600_000;

/** The collector runs about twice an hour; GitHub sometimes skips runs. */
export function collectorArea(
  collectedAt: Date | null,
  now = new Date(),
): Area {
  if (!collectedAt) return area([{ status: "warn", code: "collectorNever" }]);
  const hours = Math.floor((now.getTime() - collectedAt.getTime()) / HOUR);
  if (hours >= 24)
    return area([{ status: "bad", code: "collectorStale", values: { hours } }]);
  if (hours >= 6)
    return area([
      { status: "warn", code: "collectorStale", values: { hours } },
    ]);
  return area([]);
}

export function errorsArea(sentry: Snapshot["sentry"]): Area {
  if (!sentry) return area([], false);
  if (!sentry.ok)
    return area(
      notSetUp(sentry.error)
        ? []
        : [
            {
              status: "warn",
              code: "partFailed",
              values: { part: "sentry", error: sentry.error },
            },
          ],
      false,
    );
  const findings: Finding[] = [];
  if (sentry.newIssues24h > 0)
    findings.push({
      status: "warn",
      code: "newErrors",
      values: { count: sentry.newIssues24h },
    });
  if (sentry.events24h >= 100 || sentry.issues.some((i) => i.level === "fatal"))
    findings.push({
      status: "bad",
      code: "manyErrors",
      values: { count: sentry.events24h },
    });
  else if (sentry.events24h > 0)
    findings.push({
      status: "warn",
      code: "someErrors",
      values: { count: sentry.events24h },
    });
  return area(findings);
}

export type Meter = {
  key: "vercelStorage" | "neonCompute" | "neonStorage" | "neonTransfer";
  used: number;
  limit: number;
  /** Where it ends the month at this pace (usage that resets monthly) */
  projected: number | null;
  unit: "bytes" | "hours";
  status: Status;
};

export function meters(
  snapshot: Snapshot | null,
  databaseBytes: number,
  now = new Date(),
): Meter[] {
  const result: Meter[] = [];
  const vercel = snapshot?.vercel;
  if (vercel?.ok) {
    const kept = vercel.deployments.filter((d) => d.state === "READY").length;
    const used = kept * FREE_LIMITS.deploymentBytes;
    result.push({
      key: "vercelStorage",
      used,
      limit: FREE_LIMITS.vercelStorageBytes,
      projected: null,
      unit: "bytes",
      status: meterStatus(used, FREE_LIMITS.vercelStorageBytes),
    });
  }
  const neon = snapshot?.neon;
  if (neon?.ok) {
    const fromNeon =
      neon.periodStart && neon.periodEnd
        ? { start: new Date(neon.periodStart), end: new Date(neon.periodEnd) }
        : null;
    // Neon's own period when it looks like a month, else the calendar month.
    const period =
      fromNeon &&
      fromNeon.end.getTime() - fromNeon.start.getTime() >= 20 * 86_400_000
        ? fromNeon
        : monthAround(now);
    const hours = neon.computeSeconds / 3600;
    const projected = projectUsage(hours, period.start, period.end, now);
    result.push({
      key: "neonCompute",
      used: hours,
      limit: FREE_LIMITS.neonComputeHours,
      projected,
      unit: "hours",
      status: worst([
        meterStatus(hours, FREE_LIMITS.neonComputeHours),
        projected !== null && projected > FREE_LIMITS.neonComputeHours
          ? "warn"
          : "ok",
      ]),
    });
    const transferProjected = projectUsage(
      neon.transferBytes,
      period.start,
      period.end,
      now,
    );
    result.push({
      key: "neonTransfer",
      used: neon.transferBytes,
      limit: FREE_LIMITS.neonTransferBytes,
      projected: transferProjected,
      unit: "bytes",
      status: worst([
        meterStatus(neon.transferBytes, FREE_LIMITS.neonTransferBytes),
        transferProjected !== null &&
        transferProjected > FREE_LIMITS.neonTransferBytes
          ? "warn"
          : "ok",
      ]),
    });
  }
  // Storage comes straight from the database, so it's always there.
  const storage = Math.max(databaseBytes, neon?.ok ? neon.storageBytes : 0);
  result.push({
    key: "neonStorage",
    used: storage,
    limit: FREE_LIMITS.neonStorageBytes,
    projected: null,
    unit: "bytes",
    status: meterStatus(storage, FREE_LIMITS.neonStorageBytes),
  });
  return result;
}

export function limitsArea(all: Meter[], snapshot: Snapshot | null): Area {
  const findings: Finding[] = all
    .filter((m) => m.status === "warn" || m.status === "bad")
    .map((m) => ({
      status: m.status as "warn" | "bad",
      code: m.used / m.limit >= 0.7 ? "meterHigh" : "meterOnTrackToExceed",
      values: { meter: m.key, percent: Math.round((m.used / m.limit) * 100) },
    }));
  for (const key of ["vercel", "neon"] as const) {
    const p = snapshot?.[key];
    if (p && !p.ok && !notSetUp(p.error))
      findings.push({
        status: "warn",
        code: "partFailed",
        values: { part: key, error: p.error },
      });
  }
  return area(findings);
}

/** Secrets the site needs at runtime; `minLength` for ones we generate. */
export const RUNTIME_SECRETS: {
  name: string;
  minLength?: number;
  optional?: boolean;
}[] = [
  { name: "DATABASE_URL" },
  { name: "BETTER_AUTH_SECRET", minLength: 32 },
  { name: "BETTER_AUTH_URL" },
  { name: "GITHUB_CLIENT_ID" },
  { name: "GITHUB_CLIENT_SECRET" },
  { name: "GOOGLE_CLIENT_ID" },
  { name: "GOOGLE_CLIENT_SECRET" },
  { name: "TELEGRAM_BOT_TOKEN" },
  { name: "TELEGRAM_WEBHOOK_SECRET", minLength: 32 },
  { name: "CRON_SECRET", minLength: 32 },
  { name: "GITHUB_ISSUES_TOKEN" },
  { name: "ADMIN_EMAILS" },
  { name: "NEXT_PUBLIC_SENTRY_DSN", optional: true },
];

export type SecretCheck = {
  name: string;
  state: "set" | "missing" | "weak";
  optional: boolean;
  /** When it last changed on Vercel (from the collector) */
  updatedAt: string | null;
  old: boolean;
};

/**
 * Which secrets are set and long enough. Only lengths are looked at: values
 * never leave this function.
 */
export function checkSecrets(
  env: Record<string, string | undefined>,
  vercelEnv: { key: string; updatedAt: string }[] = [],
  now = new Date(),
): SecretCheck[] {
  return RUNTIME_SECRETS.map(({ name, minLength, optional = false }) => {
    const value = env[name];
    const updatedAt = vercelEnv.find((e) => e.key === name)?.updatedAt ?? null;
    const age = updatedAt
      ? (now.getTime() - Date.parse(updatedAt)) / 86_400_000
      : 0;
    return {
      name,
      optional,
      state: !value
        ? "missing"
        : minLength && value.length < minLength
          ? "weak"
          : "set",
      updatedAt,
      // Secrets we generate ourselves are worth renewing once a year.
      old: Boolean(minLength) && age > 365,
    };
  });
}

export type SecurityCounts = Record<
  "rate-limited" | "spam-trap" | "bad-secret" | "admin-denied",
  { n: number; people: number }
>;

export function securityArea(
  secrets: SecretCheck[],
  events: SecurityCounts,
  github: Snapshot["github"],
): Area {
  const findings: Finding[] = [];
  for (const s of secrets) {
    if (s.state === "missing" && !s.optional)
      findings.push({
        status: "bad",
        code: "secretMissing",
        values: { name: s.name },
      });
    if (s.state === "weak")
      findings.push({
        status: "bad",
        code: "secretWeak",
        values: { name: s.name },
      });
    if (s.old)
      findings.push({
        status: "warn",
        code: "secretOld",
        values: { name: s.name },
      });
  }
  if (github?.ok && github.dependabot) {
    const { critical, high, medium, low } = github.dependabot;
    if (critical + high > 0)
      findings.push({
        status: "bad",
        code: "alertsSerious",
        values: { count: critical + high },
      });
    else if (medium + low > 0)
      findings.push({
        status: "warn",
        code: "alertsMinor",
        values: { count: medium + low },
      });
  }
  if (github?.ok && github.dependabotStatus === "off")
    findings.push({ status: "warn", code: "alertsOff" });
  if (github?.ok && github.codeScanning)
    findings.push({
      status: "warn",
      code: "codeScanning",
      values: { count: github.codeScanning },
    });
  if (events["bad-secret"].n > 0)
    findings.push({
      status: "warn",
      code: "badSecret",
      values: { count: events["bad-secret"].n },
    });
  if (events["admin-denied"].n > 0)
    findings.push({
      status: "warn",
      code: "adminDenied",
      values: { count: events["admin-denied"].people },
    });
  if (events["rate-limited"].people >= 5 || events["rate-limited"].n >= 50)
    findings.push({
      status: "warn",
      code: "rateLimited",
      values: { count: events["rate-limited"].n },
    });
  if (events["spam-trap"].n >= 20)
    findings.push({
      status: "warn",
      code: "spam",
      values: { count: events["spam-trap"].n },
    });
  return area(findings);
}

// ── Admin sign-ins ───────────────────────────────────────────────────────────

/** "Chrome on macOS" from a user agent, roughly; enough to recognise a device. */
export function describeDevice(userAgent: string | null) {
  if (!userAgent) return null;
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /OPR\/|Opera/.test(userAgent)
      ? "Opera"
      : /YaBrowser/.test(userAgent)
        ? "Yandex Browser"
        : /Firefox\//.test(userAgent)
          ? "Firefox"
          : /Chrome\//.test(userAgent)
            ? "Chrome"
            : /Safari\//.test(userAgent)
              ? "Safari"
              : null;
  const system = /iPhone|iPad/.test(userAgent)
    ? "iOS"
    : /Android/.test(userAgent)
      ? "Android"
      : /Mac OS X|Macintosh/.test(userAgent)
        ? "macOS"
        : /Windows/.test(userAgent)
          ? "Windows"
          : /Linux/.test(userAgent)
            ? "Linux"
            : null;
  if (browser && system) return `${browser} · ${system}`;
  return browser ?? system ?? userAgent.slice(0, 40);
}

/** Hides the end of an IP address: 203.0.113.x, 2001:db8:85a3:… */
export function maskIp(ip: string | null) {
  if (!ip) return null;
  if (ip.includes(".")) return ip.split(".").slice(0, 3).join(".") + ".x";
  return ip.split(":").slice(0, 3).join(":") + ":…";
}
