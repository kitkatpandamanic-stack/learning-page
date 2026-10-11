import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import {
  AlertTriangle,
  ArrowLeft,
  Bug,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  Gauge,
  KeyRound,
  LogOut,
  Monitor,
  RefreshCw,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import { cn } from "cn";

import { signOutOtherDevices } from "@/app/actions/admin";
import { DailyBars } from "@/components/admin/daily-bars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { GlassCard } from "@/components/ui/glass-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Link } from "@/i18n/navigation";
import { adminEmails, getDatabaseInfo, isAdmin } from "@/lib/admin";
import {
  area,
  checkSecrets,
  collectorArea,
  compareToNormal,
  describeDevice,
  errorsArea,
  limitsArea,
  maskIp,
  meters,
  notSetUp,
  securityArea,
  worst,
  type Area,
  type Finding,
  type Status,
} from "@/lib/health";
import {
  getAdminAccess,
  getComputePerDay,
  getLatestSnapshot,
  getLearnerSignals,
} from "@/lib/health-data";
import { localeParam } from "@/lib/i18n";
import {
  getSecurityEvents,
  recordSecurityEvent,
  SECURITY_EVENT_KINDS,
} from "@/lib/security-events";
import { getSession } from "@/lib/session";
import { siteConfig } from "@/lib/site";
import type { Tone } from "@/lib/tones";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/health">): Promise<Metadata> {
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: "health" });
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

const tone: Record<Status, Tone | "neutral"> = {
  ok: "lime",
  warn: "amber",
  bad: "pink",
  unknown: "neutral",
};
const text: Record<Status, string> = {
  ok: "text-lime-300",
  warn: "text-amber-300",
  bad: "text-pink-300",
  unknown: "text-white/45",
};
const providerNames: Record<string, string> = {
  github: "GitHub",
  google: "Google",
};
const StatusIcon = ({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) => {
  const Icon =
    status === "ok"
      ? CheckCircle2
      : status === "warn"
        ? AlertTriangle
        : status === "bad"
          ? XCircle
          : CircleDashed;
  return <Icon className={cn(text[status], className)} aria-hidden />;
};

export default async function HealthPage({
  params,
}: PageProps<"/[locale]/admin/health">) {
  const locale = await localeParam(params);
  setRequestLocale(locale);
  const session = await getSession();
  if (!session || !isAdmin(session.user.email)) {
    if (session)
      recordSecurityEvent(
        "admin-denied",
        "/admin/health",
        `u:${session.user.id}`,
      );
    notFound();
  }

  const [
    { collectedAt, snapshot },
    database,
    signals,
    events,
    access,
    computePerDay,
  ] = await Promise.all([
    getLatestSnapshot(),
    getDatabaseInfo(),
    getLearnerSignals(),
    getSecurityEvents(),
    getAdminAccess(adminEmails()),
    getComputePerDay(30),
  ]);
  const t = await getTranslations("health");
  const format = await getFormatter();
  const now = new Date();
  const ago = (iso: string | Date) => format.relativeTime(new Date(iso), now);
  const size = (bytes: number) =>
    bytes >= 1024 ** 3
      ? `${format.number(bytes / 1024 ** 3, { maximumFractionDigits: 1 })} GB`
      : `${format.number(bytes / 1024 ** 2, { maximumFractionDigits: 0 })} MB`;
  const hours = (h: number) =>
    t("limits.hours", {
      value: format.number(h, { maximumFractionDigits: 1 }),
    });
  const amount = (value: number, unit: "bytes" | "hours") =>
    unit === "bytes" ? size(value) : hours(value);

  // ── Judgement ──
  const allMeters = meters(snapshot, database.bytes, now);
  const vercelEnv = snapshot?.vercel?.ok ? snapshot.vercel.env : [];
  const secrets = checkSecrets(process.env, vercelEnv, now);
  const signalResults = signals.map((s) => ({
    ...s,
    ...compareToNormal(s.last24h, s.dailyAverage),
  }));
  const areas: Record<
    "errors" | "limits" | "security" | "learners" | "collector",
    Area
  > = {
    errors: errorsArea(snapshot?.sentry),
    limits: limitsArea(allMeters, snapshot),
    security: securityArea(secrets, events.last24h, snapshot?.github),
    learners: area(
      signalResults
        .filter((s) => s.kind)
        .map((s): Finding => ({
          status: s.status as "warn" | "bad",
          code: "signal",
          values: { signal: s.key, kind: s.kind! },
        })),
    ),
    collector: collectorArea(collectedAt, now),
  };
  const verdict = worst(Object.values(areas).map((a) => a.status));
  const findings = Object.values(areas)
    .flatMap((a) => a.findings)
    .sort((a, b) => (a.status === b.status ? 0 : a.status === "bad" ? -1 : 1));
  const say = (f: Finding) =>
    // Finding codes and values are ours (see src/lib/health.ts).
    t(`findings.${f.code}` as "findings.signal", f.values as never);

  const sentry = snapshot?.sentry;
  const vercel = snapshot?.vercel;
  const github = snapshot?.github;
  const deployments = vercel?.ok ? vercel.deployments : [];
  const latestProduction = deployments
    .filter((d) => d.target === "production")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const workflowUrl = `${siteConfig.githubUrl}/actions/workflows/health.yml`;

  return (
    <Container className="flex flex-col gap-8 py-10 sm:py-14">
      <header className="flex flex-col gap-3">
        <Link
          href="/admin"
          className="flex w-fit items-center gap-1.5 text-sm text-white/55 hover:text-white"
        >
          <ArrowLeft className="size-4" /> {t("backToAdmin")}
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-white">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
      </header>

      {/* The verdict */}
      <GlassCard className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <StatusIcon status={verdict} className="size-10 shrink-0" />
            <div>
              <p className={cn("text-2xl font-bold", text[verdict])}>
                {t(`verdict.${verdict}`, {
                  count: findings.length,
                })}
              </p>
              <p className="text-sm text-white/60">
                {t(`verdictHint.${verdict}`)}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-1 text-xs text-white/45 sm:items-end">
            <span>{t("checked", { when: ago(now) })}</span>
            <span>
              {collectedAt
                ? t("collected", { when: ago(collectedAt) })
                : t("collectedNever")}
            </span>
            <a
              href={workflowUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-cyan-300 hover:underline"
            >
              <RefreshCw className="size-3" /> {t("collectNow")}
            </a>
          </div>
        </div>

        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {(Object.keys(areas) as (keyof typeof areas)[]).map((key) => (
            <a
              key={key}
              href={`#${key}`}
              className="flex flex-col gap-1 rounded-xl border border-white/8 bg-white/5 px-3 py-2.5 hover:bg-white/8"
            >
              <span className="text-sm text-white/85">{t(`areas.${key}`)}</span>
              <span
                className={cn(
                  "flex items-center gap-1 text-xs",
                  text[areas[key].status],
                )}
              >
                <StatusIcon status={areas[key].status} className="size-3.5" />
                {t(`status.${areas[key].status}`)}
              </span>
            </a>
          ))}
        </nav>

        {findings.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-medium tracking-wide text-white/45 uppercase">
              {t("needsLook")}
            </h2>
            <ul className="flex flex-col gap-1.5">
              {findings.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <StatusIcon
                    status={f.status}
                    className="mt-0.5 size-4 shrink-0"
                  />
                  <span className="text-white/85">{say(f)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </GlassCard>

      {/* Errors */}
      <GlassCard id="errors" className="flex scroll-mt-24 flex-col gap-4">
        <SectionTitle
          icon={<Bug className="size-5 text-pink-300" />}
          title={t("errors.title")}
          hint={t("errors.hint")}
          status={areas.errors.status}
          statusLabel={t(`status.${areas.errors.status}`)}
        />
        {!sentry?.ok ? (
          <p className="text-sm text-muted-foreground">
            {sentry && !notSetUp(sentry.error)
              ? say({
                  status: "warn",
                  code: "partFailed",
                  values: { part: "sentry", error: sentry.error },
                })
              : t("notSetUp")}
          </p>
        ) : sentry.issues.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("errors.empty")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-white/8">
            {sentry.issues.map((issue, i) => (
              <li key={i}>
                <a
                  href={issue.link || undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col gap-1 py-2.5 hover:text-white sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="flex items-center gap-2 text-sm text-white/85">
                      <span className="truncate">{issue.title}</span>
                      {Date.parse(issue.firstSeen) >
                        now.getTime() - 86_400_000 && (
                        <Badge tone="pink">{t("errors.new")}</Badge>
                      )}
                    </span>
                    <span className="truncate font-mono text-xs text-white/40">
                      {issue.culprit}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-white/50">
                    {t("errors.events", { count: issue.count })} ·{" "}
                    {t("errors.users", { count: issue.users })} ·{" "}
                    {ago(issue.lastSeen)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      {/* Free limits */}
      <GlassCard id="limits" className="flex scroll-mt-24 flex-col gap-5">
        <SectionTitle
          icon={<Gauge className="size-5 text-amber-300" />}
          title={t("limits.title")}
          hint={t("limits.hint")}
          status={areas.limits.status}
          statusLabel={t(`status.${areas.limits.status}`)}
        />
        <div className="grid gap-5 md:grid-cols-2">
          {allMeters.map((m) => (
            <div key={m.key} className="flex flex-col gap-1.5">
              <p className="flex items-baseline justify-between gap-2 text-xs">
                <span className="text-white/80">
                  {t(`limits.meters.${m.key}`)}
                </span>
                <span className="shrink-0 font-mono text-white/55">
                  {t("limits.usage", {
                    used: amount(m.used, m.unit),
                    limit: amount(m.limit, m.unit),
                  })}
                </span>
              </p>
              <ProgressBar
                value={m.used}
                max={m.limit}
                tone={
                  m.status === "bad"
                    ? "pink"
                    : m.status === "warn"
                      ? "amber"
                      : "lime"
                }
                size="lg"
                aria-label={t(`limits.meters.${m.key}`)}
              />
              {m.projected !== null && (
                <p
                  className={cn(
                    "text-xs",
                    m.projected > m.limit ? "text-amber-300" : "text-white/45",
                  )}
                >
                  {t("limits.projected", {
                    value: amount(m.projected, m.unit),
                  })}
                </p>
              )}
              {m.key === "vercelStorage" && (
                <p className="text-xs text-white/45">
                  {t("limits.estimate", {
                    count: deployments.filter((d) => d.state === "READY")
                      .length,
                  })}
                </p>
              )}
            </div>
          ))}
        </div>
        {(["vercel", "neon"] as const)
          .filter((part) => {
            const p = snapshot?.[part];
            return !p || (!p.ok && notSetUp(p.error));
          })
          .map((part) => (
            <p key={part} className="text-xs text-white/45">
              {t("limits.notSetUpPart", { part })} · {t("notSetUp")}
            </p>
          ))}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-medium tracking-wide text-white/45 uppercase">
              {t("limits.computePerDay")}
            </h3>
            {computePerDay.length < 2 ? (
              <p className="text-sm text-muted-foreground">
                {t("limits.noHistory")}
              </p>
            ) : (
              <DailyBars
                data={computePerDay}
                tone="amber"
                label={t("limits.computePerDay")}
                formatDay={(day) =>
                  format.dateTime(new Date(`${day}T12:00:00Z`), {
                    day: "numeric",
                    month: "short",
                    timeZone: "UTC",
                  })
                }
              />
            )}
          </div>
          {vercel?.ok && (
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-medium tracking-wide text-white/45 uppercase">
                {t("limits.deployments")}
              </h3>
              <p className="text-sm text-white/80">
                {t("limits.deploymentStates", {
                  ready: deployments.filter((d) => d.state === "READY").length,
                  failed: deployments.filter((d) => d.state === "ERROR").length,
                  building: deployments.filter((d) =>
                    ["BUILDING", "QUEUED", "INITIALIZING"].includes(d.state),
                  ).length,
                })}
              </p>
              {latestProduction && (
                <p
                  className={cn(
                    "text-sm",
                    latestProduction.state === "ERROR"
                      ? "text-pink-300"
                      : "text-white/60",
                  )}
                >
                  {t("limits.latestProduction", {
                    state: latestProduction.state,
                    when: ago(latestProduction.createdAt),
                  })}
                </p>
              )}
            </div>
          )}
        </div>
      </GlassCard>

      {/* Learners */}
      <GlassCard id="learners" className="flex scroll-mt-24 flex-col gap-4">
        <SectionTitle
          icon={<Users className="size-5 text-violet-300" />}
          title={t("learners.title")}
          hint={t("learners.hint")}
          status={areas.learners.status}
          statusLabel={t(`status.${areas.learners.status}`)}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {signalResults.map((s) => (
            <div
              key={s.key}
              className={cn(
                "flex flex-col gap-1 rounded-xl border bg-white/5 p-3",
                s.status === "bad"
                  ? "border-pink-400/40"
                  : s.status === "warn"
                    ? "border-amber-400/40"
                    : "border-white/8",
              )}
            >
              <span className="text-xs text-white/50">
                {t(`learners.signals.${s.key}`)}
              </span>
              <span className="text-2xl font-bold text-white">
                {format.number(s.last24h)}
              </span>
              <span className="text-xs text-white/45">
                {t("learners.normal", {
                  value: format.number(s.dailyAverage, {
                    maximumFractionDigits: 1,
                  }),
                })}
              </span>
              {s.kind && (
                <span className={cn("text-xs font-medium", text[s.status])}>
                  {t(`learners.kinds.${s.kind}`)}
                </span>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Security */}
      <GlassCard id="security" className="flex scroll-mt-24 flex-col gap-6">
        <SectionTitle
          icon={<ShieldCheck className="size-5 text-cyan-300" />}
          title={t("security.title")}
          status={areas.security.status}
          statusLabel={t(`status.${areas.security.status}`)}
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-2">
            <h3 className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-white/45 uppercase">
              <KeyRound className="size-3.5" /> {t("security.secrets")}
            </h3>
            <p className="text-xs text-white/45">{t("security.secretsHint")}</p>
            <ul className="flex flex-col gap-1">
              {secrets.map((s) => {
                const status: Status =
                  s.state === "set"
                    ? s.old
                      ? "warn"
                      : "ok"
                    : s.optional && s.state === "missing"
                      ? "unknown"
                      : "bad";
                return (
                  <li
                    key={s.name}
                    className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <StatusIcon status={status} className="size-4 shrink-0" />
                      <span className="truncate font-mono text-white/80">
                        {s.name}
                      </span>
                      {s.optional && (
                        <span className="text-xs text-white/35">
                          {t("security.optional")}
                        </span>
                      )}
                    </span>
                    <span className={cn("text-xs", text[status])}>
                      {t(`security.${s.state}`)}
                      {s.updatedAt && (
                        <span className="text-white/40">
                          {" · "}
                          {s.old
                            ? t("security.old")
                            : t("security.changed", { when: ago(s.updatedAt) })}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-medium tracking-wide text-white/45 uppercase">
                {t("security.events")}
              </h3>
              <dl className="grid grid-cols-2 gap-2">
                {SECURITY_EVENT_KINDS.map((kind) => (
                  <div key={kind} className="rounded-xl bg-white/5 p-3">
                    <dt className="text-xs text-white/50">
                      {t(`security.eventKinds.${kind}`)}
                    </dt>
                    <dd className="text-sm text-white">
                      <span className="text-xl font-bold">
                        {events.last24h[kind].n}
                      </span>{" "}
                      <span className="text-xs text-white/45">
                        {t("security.eventSources", {
                          people: events.last24h[kind].people,
                        })}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-medium tracking-wide text-white/45 uppercase">
                {t("security.alerts")}
              </h3>
              <p className="text-sm text-white/80">
                {!github?.ok
                  ? t("security.alertsUnknown")
                  : !github.dependabot
                    ? t("security.alertsOff")
                    : t("security.alertCounts", github.dependabot)}
              </p>
              <a
                href={`${siteConfig.githubUrl}/security`}
                target="_blank"
                rel="noreferrer"
                className="flex w-fit items-center gap-1.5 text-sm text-cyan-300 hover:underline"
              >
                {t("security.openAlerts")} <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-medium tracking-wide text-white/45 uppercase">
            {t("security.latest")}
          </h3>
          {events.latest.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("security.noEvents")}
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-white/8 text-sm">
              {events.latest.map((e, i) => (
                <li
                  key={i}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5 py-2"
                >
                  <span className="text-white/80">
                    {t(`security.eventKinds.${e.kind}`)}
                    {e.detail && (
                      <span className="font-mono text-white/45">
                        {" "}
                        · {e.detail}
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-xs text-white/40">
                    {e.who ?? "—"} · {ago(e.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-2">
            <h3 className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-white/45 uppercase">
              <Monitor className="size-3.5" /> {t("security.access")}
            </h3>
            <p className="text-xs text-white/45">{t("security.accessHint")}</p>
            <ul className="flex flex-col gap-2">
              {access.sessions.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-col rounded-xl bg-white/5 px-3 py-2"
                >
                  <span className="text-sm text-white/85">
                    {describeDevice(s.userAgent) ?? t("security.unknownDevice")}
                    {s.ip && (
                      <span className="font-mono text-white/45">
                        {" "}
                        · {maskIp(s.ip)}
                      </span>
                    )}
                    {s.id === session.session.id && (
                      <Badge tone="lime" className="ml-2">
                        {t("security.thisDevice")}
                      </Badge>
                    )}
                  </span>
                  <span className="text-xs text-white/45">
                    {s.email} ·{" "}
                    {t("security.signedIn", {
                      when: ago(s.createdAt),
                      seen: ago(s.lastSeen),
                    })}
                  </span>
                </li>
              ))}
            </ul>
            {access.sessions.length > 1 && (
              <form action={signOutOtherDevices}>
                <input type="hidden" name="locale" value={locale} />
                <Button type="submit" variant="glass" size="sm">
                  <LogOut /> {t("security.signOutOthers")}
                </Button>
              </form>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-medium tracking-wide text-white/45 uppercase">
              {t("security.providers")}
            </h3>
            <ul className="flex flex-col gap-1 text-sm">
              {access.providers.map((p, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="text-white/80">
                    <span>{providerNames[p.provider] ?? p.provider}</span>
                    <span className="text-white/45"> · {p.email}</span>
                  </span>
                  <span className="text-xs text-white/40">
                    {t("security.linked", { when: ago(p.linkedAt) })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </GlassCard>

      <div id="collector" className="scroll-mt-24 text-xs text-white/40">
        <span className="inline-flex items-center gap-1.5">
          <StatusIcon status={areas.collector.status} className="size-3.5" />
          {collectedAt
            ? t("collected", { when: ago(collectedAt) })
            : t("collectedNever")}
        </span>
      </div>
    </Container>
  );
}

function SectionTitle({
  icon,
  title,
  hint,
  status,
  statusLabel,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  status: Status;
  statusLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="flex flex-col gap-0.5">
        <h2 className="flex items-center gap-2 font-semibold text-white">
          {icon} {title}
        </h2>
        {hint && <p className="text-sm text-white/55">{hint}</p>}
      </div>
      <Badge tone={tone[status]} dot>
        {statusLabel}
      </Badge>
    </div>
  );
}
