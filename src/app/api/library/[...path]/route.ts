import { NextResponse, type NextRequest } from "next/server";

import { catalogHasFile } from "@/lib/library-items";
import { getCatalog, signedFileUrl } from "@/lib/library";
import { defaultLocale, isLocale, localizedPath } from "@/lib/i18n";
import { createRateLimiter } from "@/lib/rate-limit";
import { safeReturnPath } from "@/lib/return-path";
import { recordSecurityEvent } from "@/lib/security-events";
import { getSession } from "@/lib/session";

const noStore = { "Cache-Control": "private, no-store" };

// Plenty for reading, too few to download the whole library with a script.
const LIMIT_WINDOW_MS = 10 * 60_000;
const allowOpen = createRateLimiter(30, LIMIT_WINDOW_MS);

/**
 * Opens a library file for a signed-in learner (at most 30 files per 10
 * minutes each; refusals show on /admin/health): checks the file is in the
 * catalog, then redirects to a link into the private bucket that expires in
 * 5 minutes. Course pages link here with ?from=<the page>, so guests are sent
 * to sign in and come back to the same page, in its language.
 */
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/library/[...path]">,
) {
  const session = await getSession();
  if (!session) {
    const from = safeReturnPath(
      request.nextUrl.searchParams.get("from"),
      "/languages",
    );
    const [, prefix] = from.split("/");
    const locale = isLocale(prefix) ? prefix : defaultLocale;
    const next =
      locale === defaultLocale ? from : from.slice(prefix.length + 1) || "/";
    const signIn = new URL(
      localizedPath("/sign-in", locale),
      request.nextUrl.origin,
    );
    signIn.searchParams.set("next", next);
    signIn.searchParams.set("reason", "library");
    return NextResponse.redirect(signIn, { headers: noStore });
  }

  if (!allowOpen(session.user.id)) {
    recordSecurityEvent("rate-limited", "library", `u:${session.user.id}`);
    return NextResponse.json(
      { error: "Too many files opened, try again in a few minutes" },
      {
        status: 429,
        headers: { ...noStore, "Retry-After": String(LIMIT_WINDOW_MS / 1000) },
      },
    );
  }

  const file = (await ctx.params).path.join("/");
  const catalog = await getCatalog();
  if (!catalog) {
    return NextResponse.json(
      { error: "The library is coming soon" },
      { status: 503, headers: noStore },
    );
  }
  if (!catalogHasFile(catalog, file)) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: noStore },
    );
  }

  return NextResponse.redirect(await signedFileUrl(file), {
    headers: noStore,
  });
}
