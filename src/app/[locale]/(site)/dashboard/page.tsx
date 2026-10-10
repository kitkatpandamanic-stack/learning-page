import type { Metadata } from "next";
import type { Messages } from "next-intl";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Brain,
  Flame,
  History,
  PartyPopper,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { cn } from "cn";

import { ActivityChart } from "@/components/landing/activity-chart";
import { UserAvatar } from "@/components/layout/user-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatCard } from "@/components/ui/stat-card";
import { Link } from "@/i18n/navigation";
import { alternates, localeParam } from "@/lib/i18n";
import { getContinue, getReviewSummary, getSavedPages } from "@/lib/learning";
import { getDashboard, getTimeZone, type RecentReason } from "@/lib/progress";
import { REVIEW_XP } from "@/lib/review-schedule";
import { requireSession } from "@/lib/session";
import { toneClasses, TONES } from "@/lib/tones";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard">): Promise<Metadata> {
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return {
    title: t("metaTitle"),
    robots: { index: false },
    alternates: alternates("/dashboard", locale),
  };
}

type AchievementId = keyof Messages["achievements"];

export default async function DashboardPage({
  params,
}: PageProps<"/[locale]/dashboard">) {
  const locale = await localeParam(params);
  setRequestLocale(locale);
  const { user } = await requireSession("/dashboard");
  const timeZone = await getTimeZone();
  const [d, place, review, saved] = await Promise.all([
    getDashboard(user.id, timeZone, locale),
    getContinue(user.id, locale),
    getReviewSummary(user.id, timeZone, locale),
    getSavedPages(user.id, locale),
  ]);
  const continueWith = place.target;
  const t = await getTranslations("dashboard");
  const tAchievements = await getTranslations("achievements");
  const tWelcome = await getTranslations("welcome");
  const format = await getFormatter();
  const now = new Date();

  function timeAgo(date: Date) {
    if (now.getTime() - date.getTime() < 60_000) {
      return t("achievements.justNow");
    }
    return format.relativeTime(date, now);
  }

  function recentLabel(reason: RecentReason, title: string | null) {
    if (reason === "other") return t("recent.other");
    if (reason === "review") return t("recent.review");
    return title
      ? t(`recent.${reason}`, { title })
      : t(`recent.${reason}Unknown`);
  }

  const week = d.week.map((w) => ({
    day: format.dateTime(new Date(`${w.date}T12:00:00Z`), {
      weekday: "short",
      timeZone: "UTC",
    }),
    xp: w.xp,
  }));
  const firstName = user.name.split(" ")[0] || user.name;
  const unlockedCount = d.achievements.filter((a) => a.unlockedAt).length;
  const goalReached = d.todayXp >= d.dailyGoal;

  return (
    <Container className="flex flex-col gap-8 py-10 sm:py-14">
      {/* Header with learner level */}
      <GlassCard
        variant="strong"
        className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between"
      >
        <div className="flex items-center gap-4">
          <UserAvatar
            user={user}
            className="size-16 text-xl ring-2 ring-neon-violet/50"
          />
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              {t.rich("greeting", {
                name: firstName,
                highlight: (chunks) => <GradientText>{chunks}</GradientText>,
              })}
            </h1>
            <p className="text-muted-foreground">
              {d.streak.activeToday
                ? t("status.activeToday")
                : d.streak.current > 0
                  ? t("status.keepStreak", { count: d.streak.current })
                  : t("status.ready")}
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-80">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <Badge tone="violet" dot>
              {t("level", { level: d.level.level })}
            </Badge>
            <span className="text-xs text-white/55">
              {t("toNextLevel", {
                xp: format.number(d.level.toNext),
                level: d.level.level + 1,
              })}
            </span>
          </div>
          <ProgressBar
            value={d.level.current}
            max={d.level.span}
            tone="violet"
            size="lg"
            aria-label={t("levelProgress")}
          />
        </div>
      </GlassCard>

      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t("stats.totalXp")}
          value={format.number(d.stats.totalXp)}
          delta={t("stats.thisWeek", {
            xp: format.number(d.week.reduce((n, w) => n + w.xp, 0)),
          })}
          icon={<Sparkles />}
          tone="violet"
        />
        <StatCard
          label={t("stats.lessons")}
          value={d.stats.lessonsCompleted}
          delta={t("stats.exercises", { count: d.stats.exercisesSolved })}
          icon={<BookOpen />}
          tone="cyan"
        />
        <StatCard
          label={t("stats.streak")}
          value={`${d.streak.current}${d.streak.current > 0 ? " 🔥" : ""}`}
          delta={t("stats.bestStreak", { count: d.streak.longest })}
          icon={<Flame />}
          tone="pink"
        />
        <StatCard
          label={t("stats.achievements")}
          value={`${unlockedCount} / ${d.achievements.length}`}
          delta={
            unlockedCount ? t("stats.keepCollecting") : t("stats.unlockFirst")
          }
          icon={<Trophy />}
          tone="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-6">
          {/* Continue learning */}
          {continueWith ? (
            <GlassCard glow="violet" className="flex flex-col gap-4">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-violet-300">
                    {continueWith.reason === "resume"
                      ? t("continue.resumeLabel")
                      : continueWith.reason === "next"
                        ? t("continue.nextLabel")
                        : t("continue.startLabel")}
                  </p>
                  <p className="text-xl font-bold text-white">
                    {continueWith.title}
                  </p>
                </div>
                <Button
                  asChild
                  variant="gradient"
                  size="xl"
                  className="shrink-0"
                >
                  <Link href={continueWith.permalink}>
                    {continueWith.reason === "start"
                      ? t("continue.start")
                      : t("continue.continue")}{" "}
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
              {place.recent.length > 1 && (
                <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
                  <p className="text-xs font-medium tracking-wide text-white/45 uppercase">
                    {t("continue.recent")}
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {place.recent.slice(0, 4).map((page) => (
                      <li key={page.permalink}>
                        <Link
                          href={page.permalink}
                          className="inline-flex max-w-64 items-center gap-1.5 rounded-full bg-white/6 px-3 py-1 text-sm text-white/75 ring-1 ring-white/10 hover:bg-white/12 hover:text-white"
                        >
                          <History className="size-3.5 shrink-0 text-white/40" />
                          <span className="truncate">{page.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </GlassCard>
          ) : (
            <GlassCard glow="lime" className="flex items-center gap-3">
              <PartyPopper className="size-6 text-lime-300" />
              <p className="text-white">{t("continue.allDone")}</p>
            </GlassCard>
          )}

          {/* Weekly activity */}
          <GlassCard className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-white">
                {t("activity.title")}
              </h2>
              <span className="rounded-md bg-white/6 px-2 py-0.5 text-xs text-white/60">
                {t("activity.lastWeek")}
              </span>
            </div>
            <div className="h-56">
              <ActivityChart data={week} />
            </div>
          </GlassCard>
        </div>

        <div className="flex flex-col gap-6">
          {/* Daily review */}
          <GlassCard
            glow={review.next > 0 ? "cyan" : "none"}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-semibold text-white">
                <Brain className="size-5 text-cyan-300" /> {t("review.title")}
              </h2>
              <span className="text-xs text-amber-300">
                {t("review.xp", { xp: REVIEW_XP })}
              </span>
            </div>
            {review.next > 0 ? (
              <>
                <p className="text-sm text-white/75">
                  {t("review.waiting", { count: review.waiting })}
                </p>
                <Button asChild variant="gradient" size="lg">
                  <Link href="/review">
                    {t("review.start")} <ArrowRight />
                  </Link>
                </Button>
              </>
            ) : review.deckSize === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("review.empty")}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-lime-300">
                  {t("review.done")}
                </span>{" "}
                {t("review.doneBody")}
              </p>
            )}
          </GlassCard>

          {/* Daily goal */}
          <GlassCard className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 font-semibold text-white">
              <Target className="size-5 text-pink-300" /> {t("goal.title")}
            </h2>
            <ProgressBar
              value={Math.min(d.todayXp, d.dailyGoal)}
              max={d.dailyGoal}
              tone={goalReached ? "lime" : "pink"}
              size="lg"
              label={t("goal.progress", { xp: d.todayXp, goal: d.dailyGoal })}
            />
            <p className="text-sm text-muted-foreground">
              {goalReached
                ? t("goal.reached")
                : t("goal.remaining", { xp: d.dailyGoal - d.todayXp })}
            </p>
            {!d.profile && (
              <Link
                href="/welcome"
                className="text-sm text-cyan-300 hover:underline"
              >
                {tWelcome("settings.set")} →
              </Link>
            )}
          </GlassCard>

          {/* Saved for later */}
          <GlassCard className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 font-semibold text-white">
              <Bookmark className="size-5 text-amber-300" /> {t("saved.title")}
            </h2>
            {saved.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("saved.empty")}
              </p>
            ) : (
              <>
                <ul className="flex flex-col gap-1">
                  {saved.slice(0, 3).map((page) => (
                    <li key={page.permalink}>
                      <Link
                        href={page.permalink}
                        className="block truncate rounded-lg px-2 py-1.5 text-sm text-white/80 hover:bg-white/6 hover:text-white"
                      >
                        {page.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/saved"
                  className="text-sm text-cyan-300 hover:underline"
                >
                  {t("saved.all")}
                </Link>
              </>
            )}
          </GlassCard>

          {/* Courses */}
          <GlassCard className="flex flex-col gap-4">
            <h2 className="font-semibold text-white">{t("courses.title")}</h2>
            {d.courses.map((c, i) => (
              <ProgressBar
                key={c.slug}
                label={
                  <Link
                    href={`/languages/${c.slug}`}
                    className="hover:text-white"
                  >
                    {c.name}{" "}
                    <span className="text-white/45">
                      · {c.completed}/{c.total}
                    </span>
                  </Link>
                }
                aria-label={t("courses.progressLabel", {
                  name: c.name,
                  completed: c.completed,
                  total: c.total,
                })}
                value={c.completed}
                max={c.total}
                tone={TONES[(i + 1) % TONES.length]}
                showValue
              />
            ))}
            <Link
              href="/languages"
              className="text-sm text-cyan-300 hover:underline"
            >
              {t("courses.browse")}
            </Link>
          </GlassCard>
        </div>
      </div>

      {/* Achievements */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-white">
          {t("achievements.title")}
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {d.achievements.map((a) => {
            const tone = toneClasses[a.tone];
            const unlocked = Boolean(a.unlockedAt);
            const id = a.id as AchievementId;
            const known = tAchievements.has(`${id}.title`);
            return (
              <li key={a.id}>
                <GlassCard
                  padding="sm"
                  glow={unlocked ? a.tone : "none"}
                  className={cn(
                    "flex h-full items-start gap-3",
                    !unlocked && "opacity-55",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-xl text-2xl",
                      unlocked ? tone.soft : "bg-white/5 grayscale",
                    )}
                  >
                    {a.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-white">
                      {known ? tAchievements(`${id}.title`) : a.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {known
                        ? tAchievements(`${id}.description`)
                        : a.description}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-xs",
                        unlocked ? tone.text : "text-white/40",
                      )}
                    >
                      {a.unlockedAt
                        ? t("achievements.unlocked", {
                            time: timeAgo(a.unlockedAt),
                          })
                        : t("achievements.locked")}
                    </p>
                  </div>
                </GlassCard>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Recent activity */}
      {d.recent.length > 0 && (
        <GlassCard className="flex flex-col gap-3">
          <h2 className="font-semibold text-white">{t("recent.title")}</h2>
          <ul className="flex flex-col divide-y divide-white/8">
            {d.recent.map((e, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 py-2.5 text-sm"
              >
                <span className="text-white/80">
                  {recentLabel(e.reason, e.lessonTitle)}
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-white/40">{timeAgo(e.at)}</span>
                  <span className="font-mono font-semibold text-amber-300">
                    {t("recent.xp", { xp: e.amount })}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}
    </Container>
  );
}
