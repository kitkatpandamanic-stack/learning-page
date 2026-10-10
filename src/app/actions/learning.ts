"use server";

import type { AwardResult } from "@/app/actions/progress";
import { answerReview, isPage, recordVisit, setBookmark } from "@/lib/learning";
import { getTimeZone, summarizeAward } from "@/lib/progress";
import { codeKey, putSavedCode } from "@/lib/saved-code";
import { createRateLimiter } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

/** Saving, visiting and reviewing are cheap, but not free: keep scripts at bay. */
const allow = createRateLimiter(60, 60_000);
/** Code saves come a second or two after typing stops: more of them, separately. */
const allowCodeSave = createRateLimiter(120, 60_000);

type Refused = { ok: false; reason: "signed-out" | "invalid" | "rate-limited" };

async function signedIn(limit = allow): Promise<{ userId: string } | Refused> {
  const session = await getSession();
  if (!session) return { ok: false, reason: "signed-out" };
  if (!limit(session.user.id)) return { ok: false, reason: "rate-limited" };
  return { userId: session.user.id };
}

/** Saves a lesson or problem for later, or removes it. */
export async function saveForLater(
  permalink: string,
  saved: boolean,
): Promise<{ ok: true; saved: boolean } | Refused> {
  const user = await signedIn();
  if ("ok" in user) return user;
  if (!isPage(permalink)) return { ok: false, reason: "invalid" };
  await setBookmark(user.userId, permalink, saved);
  return { ok: true, saved };
}

/** Remembers that the learner opened a lesson or problem, for "continue". */
export async function rememberVisit(
  permalink: string,
): Promise<{ ok: true } | Refused> {
  const user = await signedIn();
  if ("ok" in user) return user;
  if (!isPage(permalink)) return { ok: false, reason: "invalid" };
  await recordVisit(user.userId, permalink);
  return { ok: true };
}

export type ReviewAnswer =
  | (Extract<AwardResult, { ok: true }> & {
      correct: boolean;
      answer: number;
      finished: boolean;
    })
  | Refused;

/** Grades a daily-review answer and schedules the question's next appearance. */
export async function submitReviewAnswer(
  ref: string,
  choice: number,
): Promise<ReviewAnswer> {
  const user = await signedIn();
  if ("ok" in user) return user;
  if (typeof ref !== "string" || !Number.isInteger(choice))
    return { ok: false, reason: "invalid" };
  const result = await answerReview(
    user.userId,
    await getTimeZone(),
    ref,
    choice,
  );
  if (!result) return { ok: false, reason: "invalid" };
  const award = await summarizeAward(user.userId, result.xpAwarded);
  return { ...award, ...result };
}

/** Saves one editor's code to the learner's account (null = reset to the starter). */
export async function saveCode(
  locale: string,
  path: string,
  storageId: string,
  code: string | null,
  editedAt: number,
): Promise<{ ok: true } | Refused> {
  const user = await signedIn(allowCodeSave);
  if ("ok" in user) return user;
  const key = codeKey(locale, path, storageId);
  if (
    !key ||
    (code !== null && typeof code !== "string") ||
    !Number.isFinite(editedAt)
  )
    return { ok: false, reason: "invalid" };
  const saved = await putSavedCode(user.userId, key, code, editedAt);
  return saved ? { ok: true } : { ok: false, reason: "invalid" };
}
