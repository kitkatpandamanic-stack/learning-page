import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Cloud,
  Flame,
  Sparkles,
} from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { ProgressBar } from "@/components/ui/progress-bar";

const perks = ["devices", "xp", "resume"] as const;

/**
 * The left half of the sign-in page on wide screens: what an account gives
 * you, as a small mock dashboard (decorative) plus the perks as text.
 */
export async function SignInPreview() {
  const t = await getTranslations("auth.signIn");
  return (
    <section className="hidden flex-col gap-5 lg:flex">
      <h2 className="text-2xl font-bold text-white">{t("preview.title")}</h2>
      <ul className="flex flex-col gap-2 text-white/80">
        {perks.map((perk) => (
          <li key={perk} className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0 text-lime-300" />
            {t(`perks.${perk}`)}
          </li>
        ))}
      </ul>

      <div aria-hidden className="grid grid-cols-2 gap-3">
        <GlassCard padding="sm" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-neon-pink/15 text-pink-300">
            <Flame className="size-5" />
          </span>
          <span className="font-semibold text-white">
            {t("preview.streak")} 🔥
          </span>
        </GlassCard>
        <GlassCard padding="sm" className="flex flex-col justify-center gap-2">
          <span className="flex items-center justify-between text-xs text-white/60">
            <span>{t("preview.level")}</span>
            <span className="flex items-center gap-1 text-amber-300">
              <Sparkles className="size-3.5" /> {t("preview.xp")}
            </span>
          </span>
          <ProgressBar value={120} max={400} tone="violet" />
        </GlassCard>
        <GlassCard
          padding="sm"
          glow="violet"
          className="col-span-2 flex items-center justify-between gap-3"
        >
          <span className="min-w-0">
            <span className="block text-xs text-violet-300">
              {t("preview.continue")}
            </span>
            <span className="block truncate font-semibold text-white">
              {t("preview.lesson")}
            </span>
          </span>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-white">
            <ArrowRight className="size-4" />
          </span>
        </GlassCard>
        <GlassCard padding="sm" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-neon-cyan/15 text-cyan-300">
            <Brain className="size-5" />
          </span>
          <span className="min-w-0 text-sm">
            <span className="block font-semibold text-white">
              {t("preview.review")}
            </span>
            <span className="block text-white/55">{t("preview.waiting")}</span>
          </span>
        </GlassCard>
        <GlassCard
          padding="sm"
          className="flex flex-col gap-2 font-mono text-xs"
        >
          <span className="flex items-center gap-1.5 font-sans text-white/45">
            <Cloud className="size-3.5" /> {t("preview.saved")}
          </span>
          <span className="text-white/80">
            <span className="text-violet-300">for</span> i{" "}
            <span className="text-violet-300">in</span>{" "}
            <span className="text-cyan-300">range</span>(3):
          </span>
          <span className="pl-4 text-white/80">
            <span className="text-cyan-300">print</span>(i)
          </span>
        </GlassCard>
      </div>
    </section>
  );
}
