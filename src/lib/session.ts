import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authConfigured } from "@/lib/auth-providers";

export async function getSession() {
  // Reading headers first keeps every page that checks the session dynamic,
  // even in builds where auth isn't configured yet.
  const requestHeaders = await headers();
  if (!authConfigured) return null;
  const { auth } = await import("@/lib/auth");
  return auth.api.getSession({ headers: requestHeaders });
}

/** For protected pages: returns the session or sends the visitor to sign in. */
export async function requireSession(returnTo: string) {
  const session = await getSession();
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);
  return session;
}

/** Only allow same-site relative paths as post-sign-in destinations. */
export function safeReturnPath(value: unknown, fallback = "/dashboard") {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
    ? value
    : fallback;
}
