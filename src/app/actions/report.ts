"use server";

import { headers } from "next/headers";

import { isLocale, localizedPath } from "@/lib/i18n";
import { getCatalog } from "@/lib/learning";
import { createRateLimiter } from "@/lib/rate-limit";
import {
  isReportCategory,
  MESSAGE_MAX,
  MESSAGE_MIN,
} from "@/lib/report-format";
import { fileReport, reportsConfigured } from "@/lib/reports";
import { getSession } from "@/lib/session";
import { siteUrl } from "@/lib/site";

/** A few reports per person an hour, and a ceiling for the whole site. */
const allowPerson = createRateLimiter(5, 60 * 60_000);
const allowSite = createRateLimiter(60, 60 * 60_000);

export type ReportResult =
  { ok: true } | { ok: false; reason: "invalid" | "rate-limited" | "failed" };

/** "Report a problem" on a lesson or practice problem: becomes a GitHub issue. */
export async function reportProblem(input: {
  permalink: string;
  category: string;
  message: string;
  locale: string;
  /** A hidden field people never fill in; bots often do. */
  website?: string;
}): Promise<ReportResult> {
  const message =
    typeof input?.message === "string" ? input.message.trim() : "";
  if (
    !reportsConfigured ||
    !isLocale(input?.locale) ||
    !isReportCategory(input.category) ||
    message.length < MESSAGE_MIN ||
    message.length > MESSAGE_MAX
  )
    return { ok: false, reason: "invalid" };
  // Bots get a cheerful "thanks" and nothing happens.
  if (input.website) return { ok: true };
  const page = getCatalog(input.locale).pages.get(input.permalink);
  if (!page) return { ok: false, reason: "invalid" };

  const session = await getSession();
  const requestHeaders = await headers();
  const who =
    session?.user.id ??
    requestHeaders.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown";
  if (!allowPerson(who) || !allowSite("site"))
    return { ok: false, reason: "rate-limited" };

  try {
    await fileReport({
      category: input.category,
      message,
      page: {
        title: page.title,
        permalink: page.permalink,
        url: `${siteUrl}${localizedPath(page.permalink, input.locale)}`,
      },
      locale: input.locale,
      signedIn: Boolean(session),
    });
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { ok: false, reason: "failed" };
  }
}
