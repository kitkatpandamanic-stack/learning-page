import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  Map as MapIcon,
  Sparkles,
  Zap,
} from "lucide-react";

import { Orb } from "@/components/landing/orb/orb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Container } from "@/components/ui/container";
import { GradientText } from "@/components/ui/gradient-text";

// Entrance animations are plain CSS (see globals.css), so the hero shows
// before any JavaScript runs. The headline and description only move,
// never fade, so phones can show the page's largest text right away.
const fadeUp = "motion-safe:animate-fade-up";

const perks = ["free", "browser", "path"] as const;

function CodeCard() {
  const t = useTranslations("home.hero.code");
  const greeting = t("greeting");
  return (
    <div className="w-56 rounded-2xl p-3 font-mono text-[11px] leading-relaxed glass-strong sm:w-64 sm:text-xs">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-neon-pink" />
        <span className="size-2.5 rounded-full bg-neon-amber" />
        <span className="size-2.5 rounded-full bg-neon-lime" />
        <span className="ml-2 text-white/50">hello.py</span>
      </div>
      <p>
        <span className="text-pink-300">def</span>{" "}
        <span className="text-cyan-300">greet</span>
        <span className="text-white/80">(name):</span>
      </p>
      <p className="pl-4">
        <span className="text-pink-300">return</span>{" "}
        <span className="text-lime-300">
          f&quot;{greeting}, {"{name}"}!&quot;
        </span>
      </p>
      <p>
        <span className="text-cyan-300">print</span>
        <span className="text-white/80">(greet(</span>
        <span className="text-lime-300">&quot;{t("name")}&quot;</span>
        <span className="text-white/80">))</span>
      </p>
      <p className="mt-2 border-t border-white/10 pt-2 text-amber-300">
        &gt; {greeting}, {t("name")}!
      </p>
    </div>
  );
}

export function Hero() {
  const t = useTranslations("home.hero");
  return (
    <section className="relative pt-12 pb-8 sm:pt-20 sm:pb-20 lg:pb-28">
      <Container className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-6">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <div className={fadeUp}>
            <Badge tone="cyan" dot>
              <Sparkles className="size-3.5" /> {t("badge")}
            </Badge>
          </div>

          <h1 className="mt-6 text-5xl leading-[1.05] font-extrabold tracking-tight text-white motion-safe:animate-rise sm:text-6xl lg:text-7xl">
            {t("titleLine1")}
            <br />
            <GradientText>{t("titleLine2")}</GradientText>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-pretty text-muted-foreground [animation-delay:100ms] motion-safe:animate-rise sm:text-xl">
            {t("description")}
          </p>

          <div
            className={`mt-9 flex flex-wrap justify-center gap-3 [animation-delay:300ms] lg:justify-start ${fadeUp}`}
          >
            <Button asChild variant="gradient" size="xl">
              <Link href="/languages">
                {t("startFree")} <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="glass" size="xl">
              <Link href="#roadmap">
                <MapIcon /> {t("seeRoadmap")}
              </Link>
            </Button>
          </div>

          <ul
            className={`mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/75 [animation-delay:400ms] lg:justify-start ${fadeUp}`}
          >
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-lime-300" />
                {t(`perks.${perk}`)}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-[560px] [animation-delay:200ms] motion-safe:animate-pop-in">
          <Orb />

          {/* Floating glass chips around the orb */}
          <div
            className={`absolute top-[6%] left-0 [animation-delay:700ms] sm:left-[2%] ${fadeUp}`}
          >
            <Chip
              icon={<CheckCircle2 />}
              tone="lime"
              label={t("chips.lessonCompleted", { number: 12 })}
              sublabel={t("chips.lessonTopic")}
              className="motion-safe:animate-float"
            />
          </div>
          <div
            className={`absolute top-[18%] right-0 [animation-delay:850ms] ${fadeUp}`}
          >
            <Chip
              icon={<Zap />}
              tone="amber"
              label={t("chips.xpGain", { count: 50 })}
              sublabel={t("chips.dailyGoal")}
              className="[animation-delay:-2s] motion-safe:animate-float"
            />
          </div>
          <div
            className={`absolute bottom-[14%] left-0 hidden [animation-delay:1000ms] sm:block ${fadeUp}`}
          >
            <Chip
              icon={<Flame />}
              tone="pink"
              label={t("chips.streak", { count: 7 })}
              sublabel={t("chips.keepGoing")}
              className="[animation-delay:-4s] motion-safe:animate-float"
            />
          </div>
          <div
            className={`absolute right-0 bottom-[4%] hidden [animation-delay:1150ms] sm:block ${fadeUp}`}
          >
            <div className="[animation-delay:-3s] motion-safe:animate-float">
              <CodeCard />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
