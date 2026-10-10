/**
 * What the sign-in page says: why the visitor is signing in (from where they
 * came from), what went wrong last time, and where "continue without an
 * account" leads. No server imports; the page passes in a title lookup.
 */

export type SignInReason =
  | { key: "save" | "page"; title: string }
  | { key: "review" | "saved" | "dashboard" | "practice" };

/** Pages that only make sense signed in: guests go somewhere useful instead. */
const accountPages = ["/dashboard", "/profile", "/review", "/saved"];

const pathOf = (returnTo: string) => returnTo.split(/[?#]/)[0];

/** Why they're here: "save" comes from the bookmark button, the rest from the page. */
export function signInReason(
  returnTo: string,
  reason: string | undefined,
  titleOf: (path: string) => string | undefined,
): SignInReason | null {
  const path = pathOf(returnTo);
  const title = titleOf(path);
  if (title) return { key: reason === "save" ? "save" : "page", title };
  if (path === "/review") return { key: "review" };
  if (path === "/saved") return { key: "saved" };
  if (path === "/dashboard" || path === "/profile") return { key: "dashboard" };
  if (path === "/practice" || path.startsWith("/practice/"))
    return { key: "practice" };
  return null;
}

export type SignInError =
  "cancelled" | "linked" | "noEmail" | "expired" | "other";

/** Better Auth's ?error= codes, grouped into messages a learner can act on. */
export function signInError(code: string | undefined): SignInError | null {
  if (!code) return null;
  switch (code) {
    case "access_denied":
      return "cancelled";
    case "account not linked":
    case "account_not_linked":
    case "unable_to_link_account":
    case "account_already_linked_to_different_user":
    case "email_does_not_match":
      return "linked";
    case "email_not_found":
    case "email_not_verified":
      return "noEmail";
    case "invalid_code":
    case "no_code":
    case "state_mismatch":
    case "state_not_found":
    case "please_restart_the_process":
      return "expired";
    default:
      return "other";
  }
}

/** Back to the page they came from, unless it needs an account. */
export function guestDestination(returnTo: string) {
  const path = pathOf(returnTo);
  return accountPages.includes(path) || path === "/sign-in"
    ? "/languages"
    : returnTo;
}
