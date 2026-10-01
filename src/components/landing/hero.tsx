"use client";

import Link from "next/link";
import { motion } from "motion/react";
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

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease },
});

const perks = ["Free to start", "Code in your browser", "Beginner → Senior"];

function CodeCard() {
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
        <span className="text-lime-300">f&quot;Hello, {"{name}"}!&quot;</span>
      </p>
      <p>
        <span className="text-cyan-300">print</span>
        <span className="text-white/80">(greet(</span>
        <span className="text-lime-300">&quot;Panda&quot;</span>
        <span className="text-white/80">))</span>
      </p>
      <p className="mt-2 border-t border-white/10 pt-2 text-amber-300">
        &gt; Hello, Panda!
      </p>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative pt-12 pb-8 sm:pt-20 sm:pb-20 lg:pb-28">
      <Container className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-6">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <motion.div {...fadeUp(0)}>
            <Badge tone="cyan" dot>
              <Sparkles className="size-3.5" /> Learn to code the fun way
            </Badge>
          </motion.div>

          <motion.h1
            {...fadeUp(0.1)}
            className="mt-6 text-5xl leading-[1.05] font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl"
          >
            Learn to code.
            <br />
            <GradientText>From Zero to Senior.</GradientText>
          </motion.h1>

          <motion.p
            {...fadeUp(0.2)}
            className="mt-6 max-w-xl text-lg text-pretty text-muted-foreground sm:text-xl"
          >
            Master JavaScript, Python, TypeScript and more with bite-sized
            lessons, real coding exercises and projects. One clear path from
            your very first line of code to senior developer.
          </motion.p>

          <motion.div
            {...fadeUp(0.3)}
            className="mt-9 flex flex-wrap justify-center gap-3 lg:justify-start"
          >
            <Button asChild variant="gradient" size="xl">
              <Link href="/languages">
                Start learning free <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="glass" size="xl">
              <Link href="#roadmap">
                <MapIcon /> See the roadmap
              </Link>
            </Button>
          </motion.div>

          <motion.ul
            {...fadeUp(0.4)}
            className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/75 lg:justify-start"
          >
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-lime-300" />
                {perk}
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease }}
          className="relative mx-auto w-full max-w-[560px]"
        >
          <Orb />

          {/* Floating glass chips around the orb */}
          <motion.div
            {...fadeUp(0.7)}
            className="absolute top-[6%] left-0 sm:left-[2%]"
          >
            <Chip
              icon={<CheckCircle2 />}
              tone="lime"
              label="Lesson 12 completed"
              sublabel="Python · Loops"
              className="motion-safe:animate-float"
            />
          </motion.div>
          <motion.div {...fadeUp(0.85)} className="absolute top-[18%] right-0">
            <Chip
              icon={<Zap />}
              tone="amber"
              label="+50 XP"
              sublabel="Daily goal reached"
              className="[animation-delay:-2s] motion-safe:animate-float"
            />
          </motion.div>
          <motion.div
            {...fadeUp(1)}
            className="absolute bottom-[14%] left-0 hidden sm:block"
          >
            <Chip
              icon={<Flame />}
              tone="pink"
              label="7-day streak"
              sublabel="Keep it going!"
              className="[animation-delay:-4s] motion-safe:animate-float"
            />
          </motion.div>
          <motion.div
            {...fadeUp(1.15)}
            className="absolute right-0 bottom-[4%] hidden sm:block"
          >
            <div className="[animation-delay:-3s] motion-safe:animate-float">
              <CodeCard />
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
