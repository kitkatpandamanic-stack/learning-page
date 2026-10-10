import type { NextRequest } from "next/server";

import { isLocale } from "@/lib/i18n";
import { getContinue } from "@/lib/learning";
import { getSession } from "@/lib/session";

/** Where the signed-in learner left off, for the navbar and the home page. */
export async function GET(request: NextRequest) {
  const param = request.nextUrl.searchParams.get("locale");
  const locale = isLocale(param) ? param : "en";
  const session = await getSession();
  if (!session) return Response.json({ signedIn: false, target: null });
  const { target } = await getContinue(session.user.id, locale);
  return Response.json(
    { signedIn: true, target },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
