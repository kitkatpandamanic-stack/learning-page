import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  CircleDashed,
  Database,
  ExternalLink,
  Flag,
  Send,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import { cn } from "cn";

import { DailyBars } from "@/components/admin/daily-bars";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { GlassCard } from "@/components/ui/glass-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatCard } from "@/components/ui/stat-card";
import { getAdminOverview, getDatabaseInfo, isAdmin } from "@/lib/admin";
import {
  getChannelMembers,
  getJobRuns,
  getReports,
  type JobRun,
} from "@/lib/admin-external";
import { languages } from "@/lib/languages";
import { localeParam } from "@/lib/i18n";
import { getSession } from "@/lib/session";
import { siteConfig } from "@/lib/site";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin">): Promise<Metadata> {
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

export default async function AdminPage({
  params,
}: PageProps<"/[locale]/admin">) {
  const locale = await localeParam(params);
  setRequestLocale(locale);
  // Everyone else gets "page not found", as if there were no admin panel.
  const session = await getSession();
  if (!session || !isAdmin(session.user.email)) notFound();

  const [overview, database, reports, dailyRuns, botRuns, followers] =
    await Promise.all([
      getAdminOverview(30),
      getDatabaseInfo(),
      getReports(),
      getJobRuns("telegram.yml"),
      getJobRuns("telegram-bot.yml"),
      getChannelMembers(),
    ]);
  const t = await getTranslations("admin");
  const format = await getFormatter();
  const now = new Date();

  const shortDay = (day: string) =>
    day
      ? format.dateTime(new Date(`${day}T12:00:00Z`), {
          day: "numeric",
          month: "short",
          timeZone: "UTC",
        })
      : "";
  const ago = (iso: string) => format.relativeTime(new Date(iso), now);
  const megabytes = (bytes: number) =>
    `${format.number(bytes / 1024 / 1024, { maximumFractionDigits: 1 })} MB`;
  const { learners, totals, funnel, telegram } = overview;
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);
  const openReports = reports?.filter((r) => r.state === "open").length ?? 0;

  return (
    <Container className="flex flex-col gap-8 py-10 sm:py-14">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-white">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
        {commit && (
          <p className="text-xs text-white/40">
            {t("deployed", {
              commit: `${commit} · ${process.env.VERCEL_GIT_COMMIT_MESSAGE?.split("\n")[0] ?? ""}`,
            })}
          </p>
        )}
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t("stats.learners")}
          value={format.number(learners.total)}
          delta={t("stats.newThisWeek", { count: learners.new7 })}
          icon={<Users />}
          tone="violet"
        />
        <StatCard
          label={t("stats.active")}
          value={format.number(learners.active1)}
          delta={t("stats.activeWeek", {
            week: learners.active7,
            month: learners.active30,
          })}
          icon={<Activity />}
          tone="cyan"
        />
        <StatCard
          label={t("stats.xp")}
          value={format.number(totals.xp)}
          icon={<Sparkles />}
          tone="amber"
        />
        <StatCard
          label={t("stats.lessons")}
          value={format.number(totals.lessons)}
          delta={t("stats.problems", { count: totals.problems })}
          icon={<BookOpen />}
          tone="pink"
        />
      </div>

      <GlassCard className="flex flex-col gap-5">
        <h2 className="font-semibold text-white">{t("charts.title")}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {(
            [
              ["signups", overview.signups, "violet"],
              ["active", overview.activeLearners, "cyan"],
              ["xp", overview.xpPerDay, "amber"],
            ] as const
          ).map(([key, data, tone]) => (
            <div key={key} className="flex flex-col gap-2">
              <p className="flex items-baseline justify-between gap-2 text-sm text-white/70">
                {t(`charts.${key}`)}
                <span className="font-mono text-xs text-white/45">
                  Σ {format.number(data.reduce((n, d) => n + d.value, 0))}
                </span>
              </p>
              <DailyBars
                data={data}
                tone={tone}
                label={t(`charts.${key}`)}
                formatDay={shortDay}
              />
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="flex flex-col gap-4">
          <div>
            <h2 className="font-semibold text-white">{t("funnel.title")}</h2>
            <p className="text-sm text-white/55">{t("funnel.hint")}</p>
          </div>
          <ol className="flex flex-col gap-3">
            {funnel.map((step) => {
              const percent = learners.total
                ? Math.round((step.n / learners.total) * 100)
                : 0;
              return (
                <li key={step.step} className="flex flex-col gap-1.5">
                  <span className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="text-white/80">
                      {t(`funnel.${step.step}`)}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-white/50">
                      {format.number(step.n)} · {t("funnel.share", { percent })}
                    </span>
                  </span>
                  <ProgressBar
                    value={step.n}
                    max={Math.max(learners.total, 1)}
                    tone="violet"
                    aria-label={t(`funnel.${step.step}`)}
                  />
                </li>
              );
            })}
          </ol>
        </GlassCard>

        <GlassCard className="flex flex-col gap-4">
          <h2 className="font-semibold text-white">{t("languages.title")}</h2>
          {overview.languages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("languages.empty")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-white/45">
                  <tr>
                    <th className="pb-2 font-medium">
                      {t("languages.language")}
                    </th>
                    <th className="pb-2 text-right font-medium">
                      {t("languages.chosen")}
                    </th>
                    <th className="pb-2 text-right font-medium">
                      {t("languages.lessons")}
                    </th>
                    <th className="pb-2 text-right font-medium">
                      {t("languages.problems")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {overview.languages.map((l) => (
                    <tr key={l.language} className="text-white/80">
                      <td className="py-2">
                        {languages.find((x) => x.slug === l.language)?.name ??
                          l.language}
                      </td>
                      <td className="py-2 text-right font-mono">{l.chosen}</td>
                      <td className="py-2 text-right font-mono">{l.lessons}</td>
                      <td className="py-2 text-right font-mono">
                        {l.problems}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 font-semibold text-white">
            <Send className="size-5 text-sky-300" /> {t("telegram.title")}
          </h2>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(
              [
                ["followers", followers ?? "—"],
                ["linked", telegram.linked],
                ["reminders", telegram.reminders],
                ["leaderboard", telegram.leaderboard],
                ["russian", telegram.ru],
              ] as const
            ).map(([key, value]) => (
              <div key={key} className="rounded-xl bg-white/5 p-3">
                <dt className="text-xs text-white/50">
                  {t(`telegram.${key}`)}
                </dt>
                <dd className="text-xl font-bold text-white">{value}</dd>
              </div>
            ))}
          </dl>
          <JobRuns
            title={t("telegram.dailyPost")}
            runs={dailyRuns}
            unavailable={t("telegram.unavailable")}
            statusLabel={(s) => t(`telegram.status.${s}`)}
            ago={ago}
          />
          <JobRuns
            title={t("telegram.botJobs")}
            runs={botRuns}
            unavailable={t("telegram.unavailable")}
            statusLabel={(s) => t(`telegram.status.${s}`)}
            ago={ago}
          />
        </GlassCard>

        <GlassCard className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-semibold text-white">
              <Flag className="size-5 text-pink-300" /> {t("reports.title")}
            </h2>
            {reports && (
              <Badge tone={openReports ? "pink" : "lime"} dot>
                {t("reports.open", { count: openReports })}
              </Badge>
            )}
          </div>
          {!reports ? (
            <p className="text-sm text-muted-foreground">
              {t("reports.unavailable")}
            </p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("reports.empty")}
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-white/8">
              {reports.slice(0, 10).map((r) => (
                <li key={r.number}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-white"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          r.state === "open" ? "bg-pink-400" : "bg-lime-400",
                        )}
                        aria-label={
                          r.state === "open"
                            ? t("reports.stateOpen")
                            : t("reports.stateClosed")
                        }
                      />
                      <span
                        className={cn(
                          "truncate",
                          r.state === "open"
                            ? "text-white/85"
                            : "text-white/45",
                        )}
                      >
                        {r.title}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-white/40">
                      {ago(r.createdAt)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          <a
            href={`${siteConfig.githubUrl}/issues?q=label%3Areport`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-sm text-cyan-300 hover:underline"
          >
            {t("reports.allOnGitHub")} <ExternalLink className="size-3.5" />
          </a>
        </GlassCard>
      </div>

      <GlassCard className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 font-semibold text-white">
          <Database className="size-5 text-lime-300" /> {t("database.title")}
        </h2>
        <ProgressBar
          value={database.bytes}
          max={database.limitBytes}
          tone={database.bytes / database.limitBytes > 0.8 ? "pink" : "lime"}
          size="lg"
          label={t("database.size", {
            used: megabytes(database.bytes),
            limit: megabytes(database.limitBytes),
          })}
        />
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-medium tracking-wide text-white/45 uppercase">
            {t("database.tables")}
          </h3>
          <ul className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            {database.tables.map((table) => (
              <li
                key={table.name}
                className="flex justify-between gap-3 text-white/75"
              >
                <span className="font-mono">{table.name}</span>
                <span className="text-white/45">
                  {t("database.rows", { count: format.number(table.rows) })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </GlassCard>
    </Container>
  );
}

type RunStatus = "success" | "failure" | "cancelled" | "skipped" | "running";

function JobRuns({
  title,
  runs,
  unavailable,
  statusLabel,
  ago,
}: {
  title: string;
  runs: JobRun[] | null;
  unavailable: string;
  statusLabel: (status: RunStatus) => string;
  ago: (iso: string) => string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-medium tracking-wide text-white/45 uppercase">
        {title}
      </h3>
      {!runs ? (
        <p className="text-sm text-muted-foreground">{unavailable}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {runs.slice(0, 4).map((run) => {
            const status: RunStatus =
              run.status !== "completed"
                ? "running"
                : ((run.conclusion as RunStatus | null) ?? "running");
            const Icon =
              status === "success"
                ? CheckCircle2
                : status === "failure"
                  ? XCircle
                  : CircleDashed;
            return (
              <li key={run.url}>
                <a
                  href={run.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-white/5"
                >
                  <span className="flex items-center gap-2">
                    <Icon
                      className={cn(
                        "size-4",
                        status === "success"
                          ? "text-lime-300"
                          : status === "failure"
                            ? "text-pink-300"
                            : "text-white/45",
                      )}
                    />
                    <span className="text-white/80">
                      {statusLabel(
                        [
                          "success",
                          "failure",
                          "cancelled",
                          "skipped",
                          "running",
                        ].includes(status)
                          ? status
                          : "running",
                      )}
                    </span>
                  </span>
                  <span className="text-xs text-white/40">
                    {ago(run.createdAt)}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
