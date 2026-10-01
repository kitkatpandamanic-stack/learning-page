import type { Metadata } from "next";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { CalendarDays, Link2, Mail } from "lucide-react";

import {
  DeleteAccountButton,
  SignOutButton,
} from "@/components/auth/account-actions";
import { UserAvatar } from "@/components/layout/user-menu";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { GlassCard } from "@/components/ui/glass-card";
import { alternates, localeParam } from "@/lib/i18n";
import { getLinkedProviders, getTimeZone } from "@/lib/progress";
import { requireSession } from "@/lib/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/profile">): Promise<Metadata> {
  const locale = await localeParam(params);
  const t = await getTranslations({ locale, namespace: "profile" });
  return {
    title: t("metaTitle"),
    robots: { index: false },
    alternates: alternates("/profile", locale),
  };
}

const providerNames: Record<string, string> = {
  github: "GitHub",
  google: "Google",
};

export default async function ProfilePage({
  params,
}: PageProps<"/[locale]/profile">) {
  const locale = await localeParam(params);
  setRequestLocale(locale);
  const { user } = await requireSession("/profile");
  const [providers, timeZone] = await Promise.all([
    getLinkedProviders(user.id),
    getTimeZone(),
  ]);
  const t = await getTranslations("profile");
  const format = await getFormatter();

  return (
    <Container className="flex max-w-3xl flex-col gap-6 py-10 sm:py-14">
      <GlassCard
        variant="strong"
        padding="lg"
        className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left"
      >
        <UserAvatar
          user={user}
          className="size-24 text-2xl ring-4 ring-neon-violet/40"
        />
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-white">{user.name}</h1>
          <p className="flex items-center justify-center gap-2 text-muted-foreground sm:justify-start">
            <Mail className="size-4" /> {user.email}
          </p>
          <p className="flex items-center justify-center gap-2 text-sm text-white/55 sm:justify-start">
            <CalendarDays className="size-4" />
            {t("memberSince", {
              date: format.dateTime(user.createdAt, {
                month: "long",
                year: "numeric",
                timeZone,
              }),
            })}
          </p>
        </div>
      </GlassCard>

      <GlassCard className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Link2 className="size-5 text-cyan-300" /> {t("connected")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {providers.map((p) => (
            <Badge key={p} tone="cyan" dot>
              {providerNames[p] ?? p}
            </Badge>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-white">{t("account")}</h2>
        <div className="flex flex-col items-start gap-4">
          <SignOutButton />
          <DeleteAccountButton />
        </div>
      </GlassCard>
    </Container>
  );
}
