import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckCircle2, Wrench } from "lucide-react";

import { LogoMark } from "@/components/brand/logo";
import { SignInButtons } from "@/components/auth/sign-in-buttons";
import { Container } from "@/components/ui/container";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { Link, redirect } from "@/i18n/navigation";
import { enabledProviders } from "@/lib/auth-providers";
import { alternates, localeParam, localizedPath } from "@/lib/i18n";
import { safeReturnPath } from "@/lib/return-path";
import { getSession } from "@/lib/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/sign-in">): Promise<Metadata> {
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: "auth.signIn" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    robots: { index: false },
    alternates: alternates("/sign-in", locale),
  };
}

const perks = ["devices", "xp", "resume"] as const;

export default async function SignInPage({
  params,
  searchParams,
}: PageProps<"/[locale]/sign-in">) {
  const locale = await localeParam(params);
  setRequestLocale(locale);
  const t = await getTranslations("auth.signIn");
  const { next, error } = await searchParams;
  const returnTo = safeReturnPath(next);

  if (enabledProviders.length > 0 && (await getSession())) {
    redirect({ href: returnTo, locale });
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
            {t.rich("title", {
              brand: (chunks) => <GradientText>{chunks}</GradientText>,
            })}
          </h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>

        <ul className="flex flex-col gap-2 self-stretch text-left text-sm text-white/75">
          {perks.map((perk) => (
            <li key={perk} className="flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0 text-lime-300" />
              {t(`perks.${perk}`)}
            </li>
          ))}
        </ul>

        <div className="self-stretch">
          {error && (
            <p
              role="alert"
              className="mb-4 rounded-xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"
            >
              {t("error")}
            </p>
          )}
          {enabledProviders.length > 0 ? (
            <SignInButtons
              providers={enabledProviders}
              returnTo={localizedPath(returnTo, locale)}
            />
          ) : (
            <p className="flex items-start gap-3 rounded-xl border border-neon-amber/40 bg-neon-amber/10 px-4 py-3 text-left text-sm text-amber-100">
              <Wrench className="mt-0.5 size-4 shrink-0 text-amber-300" />
              {t("disabled")}
            </p>
          )}
        </div>

        <p className="text-xs text-white/55">
          {t.rich("legal", {
            terms: (chunks) => (
              <Link href="/terms" className="underline hover:text-white">
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link href="/privacy" className="underline hover:text-white">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </GlassCard>
    </Container>
  );
}
