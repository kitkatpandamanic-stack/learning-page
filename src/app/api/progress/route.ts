import type { NextRequest } from "next/server";

import { getLanguage } from "@/lib/content";
import { getLanguageProgress } from "@/lib/progress";
import { getSession } from "@/lib/session";

/** The signed-in learner's progress in one language, for client components. */
export async function GET(request: NextRequest) {
  const language = request.nextUrl.searchParams.get("language") ?? "";
  if (!getLanguage(language)) {
    return Response.json({ error: "Unknown language" }, { status: 400 });
  }
  const session = await getSession();
  if (!session) {
    return Response.json({ signedIn: false, completed: [], activities: [] });
  }
  const progress = await getLanguageProgress(session.user.id, language);
  return Response.json(
    { signedIn: true, ...progress },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
