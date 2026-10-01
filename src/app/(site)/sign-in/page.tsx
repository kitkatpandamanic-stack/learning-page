import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Wrench } from "lucide-react";

import { LogoMark } from "@/components/brand/logo";
import { SignInButtons } from "@/components/auth/sign-in-buttons";
import { Container } from "@/components/ui/container";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { enabledProviders } from "@/lib/auth-providers";
import { safeReturnPath } from "@/lib/return-path";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to PandaDev to save your progress, XP and streaks.",
  robots: { index: false },
};

const perks = [
  "Save your progress across devices",
  "Earn XP and keep your streak",
  "Pick up exactly where you left off",
];

export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  const { next, error } = await searchParams;
  const returnTo = safeReturnPath(next);

  if (enabledProviders.length > 0 && (await getSession())) {
    redirect(returnTo);
  }

  return (
    <Container className="flex flex-1 items-center justify-center py-16">
      <GlassCard
        variant="strong"
        glow="violet"
        padding="lg"
        className="flex w-full max-w-md flex-col items-center gap-6 text-center sm:p-10"
      >
        <LogoMark className="size-16 drop-shadow-[0_0_24px_rgb(139_92_246/0.8)]" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Welcome to <GradientText>PandaDev</GradientText>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sign in or create an account in one click.
          </p>
        </div>

        <ul className="flex flex-col gap-2 self-stretch text-left text-sm text-white/75">
          {perks.map((perk) => (
            <li key={perk} className="flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0 text-lime-300" />
              {perk}
            </li>
          ))}
        </ul>

        <div className="self-stretch">
          {error && (
            <p
              role="alert"
              className="mb-4 rounded-xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
            >
              Sign-in didn&apos;t complete. Please try again.
            </p>
          )}
          {enabledProviders.length > 0 ? (
            <SignInButtons providers={enabledProviders} returnTo={returnTo} />
          ) : (
            <p className="flex items-start gap-3 rounded-xl border border-neon-amber/40 bg-neon-amber/10 px-4 py-3 text-left text-sm text-amber-100">
              <Wrench className="mt-0.5 size-4 shrink-0 text-amber-300" />
              Sign-in isn&apos;t switched on yet. Lessons are still free to read
              without an account.
            </p>
          )}
        </div>

        <p className="text-xs text-white/55">
          By continuing you agree to our{" "}
          <Link href="/terms" className="underline hover:text-white">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-white">
            Privacy Policy
          </Link>
          .
        </p>
      </GlassCard>
    </Container>
  );
}
