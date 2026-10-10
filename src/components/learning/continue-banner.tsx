"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, History, XIcon } from "lucide-react";

import { useContinue, useLastVisit } from "@/components/learning/use-learning";
import { Link } from "@/i18n/navigation";
import { useSession } from "@/lib/auth-client";

/**
 * A small floating card on the home page for returning learners: the page
 * they left off at (from their account, or this browser when signed out).
 */
export function ContinueBanner() {
  const t = useTranslations("home.continue");
  const tDashboard = useTranslations("dashboard.continue");
  const { data: session, isPending } = useSession();
  const signedIn = Boolean(session?.user);
  const { data } = useContinue(signedIn);
  const local = useLastVisit();
  const [hidden, setHidden] = React.useState(false);

  const target = signedIn
    ? data?.target && data.target.reason !== "start"
      ? {
          href: data.target.permalink,
          title: data.target.title,
          label:
            data.target.reason === "next"
              ? tDashboard("nextLabel")
              : t("label"),
        }
      : null
    : local && { href: local.permalink, title: local.title, label: t("label") };

  if (hidden || isPending || !target) return null;

  return (
    <aside
      aria-label={target.label}
      className="fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-md animate-in items-center gap-3 rounded-2xl py-2.5 pr-2 pl-3 glass-strong fade-in-0 slide-in-from-bottom-4 sm:bottom-6"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-neon-violet/20 text-violet-300">
        <History className="size-4.5" />
      </span>
      <Link href={target.href} className="group min-w-0 flex-1">
        <span className="block text-xs text-violet-300">{target.label}</span>
        <span className="flex items-center gap-1.5 font-semibold text-white">
          <span className="truncate">{target.title}</span>
          <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </span>
        <span className="sr-only">{t("action")}</span>
      </Link>
      <button
        type="button"
        onClick={() => setHidden(true)}
        aria-label={t("dismiss")}
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white"
      >
        <XIcon className="size-4" />
      </button>
    </aside>
  );
}
