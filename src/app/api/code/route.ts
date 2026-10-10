import type { NextRequest } from "next/server";

import { isLocale } from "@/lib/i18n";
import { codeKey, getSavedCode } from "@/lib/saved-code";
import { getSession } from "@/lib/session";

/** The signed-in learner's saved code for every editor on one page. */
export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("locale") ?? "";
  const path = request.nextUrl.searchParams.get("path") ?? "";
  if (!isLocale(locale) || !codeKey(locale, path, "exercise-1")) {
    return Response.json({ error: "Unknown page" }, { status: 400 });
  }
  const session = await getSession();
  if (!session) return Response.json({ signedIn: false, editors: {} });
  return Response.json(
    {
      signedIn: true,
      editors: await getSavedCode(session.user.id, locale, path),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
