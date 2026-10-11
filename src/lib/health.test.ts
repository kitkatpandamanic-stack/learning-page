import { describe, expect, it } from "vitest";

import {
  backupsArea,
  checkSecrets,
  collectorArea,
  compareToNormal,
  describeDevice,
  errorsArea,
  FREE_LIMITS,
  limitsArea,
  maskIp,
  meterStatus,
  meters,
  projectUsage,
  readSnapshot,
  securityArea,
  worst,
  type SecurityCounts,
} from "@/lib/health";

const quiet: SecurityCounts = {
  "rate-limited": { n: 0, people: 0 },
  "spam-trap": { n: 0, people: 0 },
  "bad-secret": { n: 0, people: 0 },
  "admin-denied": { n: 0, people: 0 },
};

describe("worst", () => {
  it("picks the most serious status", () => {
    expect(worst(["ok", "warn", "ok"])).toBe("warn");
    expect(worst(["warn", "bad"])).toBe("bad");
  });

  it("ignores parts that aren't set up unless nothing is known", () => {
    expect(worst(["ok", "unknown"])).toBe("ok");
    expect(worst(["unknown", "unknown"])).toBe("unknown");
  });
});

describe("meterStatus", () => {
  it("is yellow from 70% and red from 90%", () => {
    expect(meterStatus(69, 100)).toBe("ok");
    expect(meterStatus(70, 100)).toBe("warn");
    expect(meterStatus(90, 100)).toBe("bad");
  });
});

describe("projectUsage", () => {
  const start = new Date("2026-10-01T00:00:00Z");
  const end = new Date("2026-11-01T00:00:00Z");

  it("extends the current pace to the end of the period", () => {
    // 10 hours in the first 10 days of a 31-day month
    expect(
      projectUsage(10, start, end, new Date("2026-10-11T00:00:00Z")),
    ).toBeCloseTo(31);
  });

  it("waits for the first day to pass", () => {
    expect(
      projectUsage(1, start, end, new Date("2026-10-01T12:00:00Z")),
    ).toBeNull();
  });
});

describe("compareToNormal", () => {
  it("flags nothing on a day that's usually busy", () => {
    expect(compareToNormal(0, 4)).toEqual({ status: "bad", kind: "zero" });
  });

  it("stays calm on a quiet site", () => {
    expect(compareToNormal(0, 0.5).status).toBe("ok");
    expect(compareToNormal(1, 1.5).status).toBe("ok");
  });

  it("warns about a big drop or a spike", () => {
    expect(compareToNormal(2, 10)).toEqual({ status: "warn", kind: "low" });
    expect(compareToNormal(40, 5)).toEqual({ status: "warn", kind: "spike" });
    expect(compareToNormal(12, 10).status).toBe("ok");
  });
});

describe("readSnapshot", () => {
  it("rejects anything that isn't a version 1 snapshot", () => {
    expect(readSnapshot(null)).toBeNull();
    expect(readSnapshot({ version: 2 })).toBeNull();
    expect(readSnapshot([])).toBeNull();
  });

  it("reads why Dependabot counts are missing, also from older snapshots", () => {
    const read = (github: object) => {
      const part = readSnapshot({
        version: 1,
        github: { ok: true, ...github },
      })?.github;
      return part?.ok ? part.dependabotStatus : null;
    };
    expect(read({ dependabot: null, dependabotStatus: "no-access" })).toBe(
      "no-access",
    );
    expect(read({ dependabot: null })).toBe("failed");
    expect(read({ dependabot: { high: 1 } })).toBe("ok");
  });

  it("keeps failed parts as failures with a short message", () => {
    const snapshot = readSnapshot({
      version: 1,
      neon: { ok: false, error: "HTTP 401" },
    });
    expect(snapshot?.neon).toEqual({ ok: false, error: "HTTP 401" });
    expect(snapshot?.vercel).toBeUndefined();
  });

  it("zeroes wrong types and drops links that aren't Sentry's", () => {
    const snapshot = readSnapshot({
      version: 1,
      neon: { ok: true, computeSeconds: "lots", storageBytes: 5 },
      sentry: {
        ok: true,
        events24h: 3,
        issues: [
          { title: "TypeError", link: "javascript:alert(1)" },
          { title: "RangeError", link: "https://pandadev.sentry.io/issues/1/" },
        ],
      },
    });
    expect(snapshot?.neon).toMatchObject({
      ok: true,
      computeSeconds: 0,
      storageBytes: 5,
    });
    const sentry = snapshot?.sentry;
    expect(sentry?.ok && sentry.issues.map((i) => i.link)).toEqual([
      "",
      "https://pandadev.sentry.io/issues/1/",
    ]);
  });
});

describe("collectorArea", () => {
  const now = new Date("2026-10-11T12:00:00Z");
  it("is fine when the collector ran recently", () => {
    expect(collectorArea(new Date("2026-10-11T11:00:00Z"), now).status).toBe(
      "ok",
    );
  });
  it("warns after 6 hours and turns red after a day", () => {
    expect(collectorArea(new Date("2026-10-11T05:00:00Z"), now).status).toBe(
      "warn",
    );
    expect(collectorArea(new Date("2026-10-10T11:00:00Z"), now).status).toBe(
      "bad",
    );
    expect(collectorArea(null, now).status).toBe("warn");
  });
});

describe("errorsArea", () => {
  it("is unknown until Sentry is set up, without nagging", () => {
    expect(errorsArea(undefined)).toEqual({ status: "unknown", findings: [] });
    expect(
      errorsArea({ ok: false, error: "not set up (SENTRY_READ_TOKEN)" }),
    ).toEqual({ status: "unknown", findings: [] });
  });

  it("warns about some errors and turns red with many", () => {
    const base = { ok: true as const, newIssues24h: 0, issues: [] };
    expect(errorsArea({ ...base, events24h: 0 }).status).toBe("ok");
    expect(errorsArea({ ...base, events24h: 3 }).status).toBe("warn");
    expect(errorsArea({ ...base, events24h: 150 }).status).toBe("bad");
  });
});

describe("meters", () => {
  const now = new Date("2026-10-16T00:00:00Z");

  it("always shows database storage, from the database itself", () => {
    const all = meters(null, 100 * 1024 ** 2, now);
    expect(all.map((m) => m.key)).toEqual(["neonStorage"]);
    expect(all[0].status).toBe("ok");
  });

  it("estimates Vercel storage from the deployments kept", () => {
    const deployments = Array.from({ length: 7 }, () => ({
      state: "READY",
      target: "production",
      createdAt: now.toISOString(),
    }));
    const [vercel] = meters(
      { version: 1, vercel: { ok: true, deployments, env: [] } },
      0,
      now,
    );
    expect(vercel.used).toBeCloseTo(7 * FREE_LIMITS.deploymentBytes);
    expect(vercel.status).toBe("warn");
  });

  it("warns when Neon compute is on track to pass the limit", () => {
    // 60 CU-hours by the middle of the month: about 120 by the end
    const all = meters(
      {
        version: 1,
        neon: {
          ok: true,
          computeSeconds: 60 * 3600,
          activeSeconds: 0,
          transferBytes: 0,
          storageBytes: 0,
          periodStart: null,
          periodEnd: null,
        },
      },
      0,
      now,
    );
    const compute = all.find((m) => m.key === "neonCompute")!;
    expect(compute.used).toBe(60);
    expect(compute.projected).toBeGreaterThan(100);
    expect(compute.status).toBe("warn");
    expect(limitsArea(all, null).findings).toEqual([
      {
        status: "warn",
        code: "meterOnTrackToExceed",
        values: { meter: "neonCompute", percent: 60 },
      },
    ]);
  });
});

describe("checkSecrets", () => {
  const strong = "x".repeat(64);
  const env = {
    DATABASE_URL: "postgres://…",
    BETTER_AUTH_SECRET: strong,
    BETTER_AUTH_URL: "https://pandadev.test",
    GITHUB_CLIENT_ID: "id",
    GITHUB_CLIENT_SECRET: "secret",
    GOOGLE_CLIENT_ID: "id",
    GOOGLE_CLIENT_SECRET: "secret",
    TELEGRAM_BOT_TOKEN: "token",
    TELEGRAM_WEBHOOK_SECRET: strong,
    CRON_SECRET: "short",
    GITHUB_ISSUES_TOKEN: "token",
    ADMIN_EMAILS: "me@pandadev.test",
  };

  it("reports missing, short and old secrets without their values", () => {
    const checks = checkSecrets(
      env,
      [{ key: "BETTER_AUTH_SECRET", updatedAt: "2025-01-01T00:00:00Z" }],
      new Date("2026-10-11T00:00:00Z"),
    );
    const byName = Object.fromEntries(checks.map((c) => [c.name, c]));
    expect(byName.CRON_SECRET.state).toBe("weak");
    expect(byName.NEXT_PUBLIC_SENTRY_DSN).toMatchObject({
      state: "missing",
      optional: true,
    });
    expect(byName.BETTER_AUTH_SECRET.old).toBe(true);
    expect(JSON.stringify(checks)).not.toContain(strong);

    const security = securityArea(checks, quiet, undefined);
    expect(security.status).toBe("bad");
    expect(security.findings.map((f) => f.code)).toEqual([
      "secretOld",
      "secretWeak",
    ]);
  });
});

describe("securityArea", () => {
  it("is calm with nothing going on", () => {
    expect(securityArea([], quiet, undefined).status).toBe("ok");
  });

  it("is red for serious dependency alerts and asks to turn alerts on", () => {
    const serious = securityArea([], quiet, {
      ok: true,
      dependabot: { critical: 0, high: 1, medium: 2, low: 0 },
      dependabotStatus: "ok",
      codeScanning: null,
      backup: null,
    });
    expect(serious.status).toBe("bad");
    const off = securityArea([], quiet, {
      ok: true,
      dependabot: null,
      dependabotStatus: "off",
      codeScanning: null,
      backup: null,
    });
    expect(off.findings.map((f) => f.code)).toEqual(["alertsOff"]);
    // Alerts on, but no key that may read them: not the site's problem
    const noAccess = securityArea([], quiet, {
      ok: true,
      dependabot: null,
      dependabotStatus: "no-access",
      codeScanning: null,
      backup: null,
    });
    expect(noAccess.status).toBe("ok");
  });

  it("warns about wrong secrets and people poking at admin", () => {
    const area = securityArea(
      [],
      {
        ...quiet,
        "bad-secret": { n: 3, people: 1 },
        "admin-denied": { n: 1, people: 1 },
      },
      undefined,
    );
    expect(area.status).toBe("warn");
    expect(area.findings.map((f) => f.code)).toEqual([
      "badSecret",
      "adminDenied",
    ]);
  });
});

describe("describeDevice and maskIp", () => {
  it("names common browsers and systems", () => {
    expect(
      describeDevice(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
      ),
    ).toBe("Chrome · macOS");
    expect(
      describeDevice(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      ),
    ).toBe("Safari · iOS");
    expect(describeDevice(null)).toBeNull();
  });

  it("hides the end of an IP address", () => {
    expect(maskIp("203.0.113.42")).toBe("203.0.113.x");
    expect(maskIp("2001:db8:85a3:0:0:8a2e:370:7334")).toBe("2001:db8:85a3:…");
  });
});

describe("backupsArea", () => {
  const now = new Date("2026-10-12T12:00:00Z");
  const github = (backup: object | null) =>
    readSnapshot({ version: 1, github: { ok: true, dependabot: null, backup } })
      ?.github;

  it("is unknown until the backup workflow exists", () => {
    expect(backupsArea(github(null), now).status).toBe("unknown");
    expect(backupsArea(undefined, now).status).toBe("unknown");
  });

  it("is fine with last night's backup", () => {
    const area = backupsArea(
      github({
        lastRunAt: "2026-10-11T21:23:00Z",
        lastConclusion: "success",
        lastSuccessAt: "2026-10-11T21:25:00Z",
        sizeBytes: 2_000_000,
      }),
      now,
    );
    expect(area).toEqual({ status: "ok", findings: [] });
  });

  it("turns red when the last run failed or backups stopped", () => {
    expect(
      backupsArea(
        github({
          lastRunAt: "2026-10-11T21:23:00Z",
          lastConclusion: "failure",
          lastSuccessAt: "2026-10-11T02:00:00Z",
          sizeBytes: 2_000_000,
        }),
        now,
      ).findings.map((f) => f.code),
    ).toEqual(["backupFailed"]);
    expect(
      backupsArea(
        github({
          lastRunAt: "2026-10-09T21:23:00Z",
          lastConclusion: "success",
          lastSuccessAt: "2026-10-09T21:25:00Z",
          sizeBytes: 2_000_000,
        }),
        now,
      ),
    ).toEqual({
      status: "bad",
      findings: [{ status: "bad", code: "backupStale", values: { hours: 62 } }],
    });
  });

  it("asks for a first backup when none succeeded yet", () => {
    expect(
      backupsArea(
        github({
          lastRunAt: null,
          lastConclusion: null,
          lastSuccessAt: null,
          sizeBytes: null,
        }),
        now,
      ).findings.map((f) => f.code),
    ).toEqual(["backupNever"]);
  });
});
