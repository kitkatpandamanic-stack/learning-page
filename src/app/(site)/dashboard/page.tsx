import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Flame, Sparkles, Trophy } from "lucide-react";

import { UserAvatar } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { StatCard } from "@/components/ui/stat-card";
import { getUserStats } from "@/lib/progress";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

export default async function DashboardPage() {
  const { user } = await requireSession("/dashboard");
  const stats = await getUserStats(user.id);
  const firstName = user.name.split(" ")[0] || user.name;

  return (
    <Container className="flex flex-col gap-8 py-10 sm:py-14">
      <header className="flex items-center gap-4">
        <UserAvatar
          user={user}
          className="size-14 ring-2 ring-neon-violet/50"
        />
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Welcome back, <GradientText>{firstName}</GradientText> 👋
          </h1>
          <p className="text-muted-foreground">
            Ready to write some code today?
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total XP"
          value={stats.totalXp.toLocaleString("en")}
          icon={<Sparkles />}
          tone="violet"
        />
        <StatCard
          label="Lessons done"
          value={stats.lessonsCompleted}
          icon={<BookOpen />}
          tone="cyan"
        />
        <StatCard
          label="Day streak"
          value="–"
          delta="Coming soon"
          icon={<Flame />}
          tone="pink"
        />
        <StatCard
          label="Achievements"
          value="–"
          delta="Coming soon"
          icon={<Trophy />}
          tone="amber"
        />
      </div>

      <GlassCard
        glow="violet"
        className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 className="text-xl font-bold text-white">
            {stats.lessonsCompleted === 0
              ? "Start your first lesson"
              : "Keep the momentum going"}
          </h2>
          <p className="text-muted-foreground">
            Your full dashboard with charts, streaks and achievements is on its
            way. Meanwhile, keep learning!
          </p>
        </div>
        <Button asChild variant="gradient" size="xl" className="shrink-0">
          <Link href="/languages">
            Browse courses <ArrowRight />
          </Link>
        </Button>
      </GlassCard>
    </Container>
  );
}
