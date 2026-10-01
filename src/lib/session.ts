import "server-only";

import { headers } from "next/headers";
import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { authConfigured } from "@/lib/auth-providers";
import type { Locale } from "@/lib/i18n";

export async function getSession() {
  // Reading headers first keeps every page that checks the session dynamic,
  // even in builds where auth isn't configured yet.
  const requestHeaders = await headers();
  if (!authConfigured) return null;
  const { auth } = await import("@/lib/auth");
  return auth.api.getSession({ headers: requestHeaders });
}

/**
 * For protected pages: returns the session or sends the visitor to sign in,
 * in their language. `returnTo` is a path without the locale, e.g. "/profile".
 */
export async function requireSession(returnTo: string) {
  const session = await getSession();
  if (!session) {
    const locale = (await getLocale()) as Locale;
    return redirect({
      href: { pathname: "/sign-in", query: { next: returnTo } },
      locale,
    });
  }
  return session;
}
