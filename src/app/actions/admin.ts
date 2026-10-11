"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { isAdmin } from "@/lib/admin";
import { isLocale, localizedPath } from "@/lib/i18n";
import { getSession } from "@/lib/session";

/** "Sign out other devices" on /admin/health: ends every admin session but this one. */
export async function signOutOtherDevices(formData: FormData) {
  const session = await getSession();
  const locale = formData.get("locale");
  if (!session || !isAdmin(session.user.email) || !isLocale(locale)) return;
  const { auth } = await import("@/lib/auth");
  await auth.api.revokeOtherSessions({ headers: await headers() });
  revalidatePath(localizedPath("/admin/health", locale));
}
