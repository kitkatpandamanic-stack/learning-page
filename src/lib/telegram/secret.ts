import "server-only";

import { timingSafeEqual } from "node:crypto";

/** Compares a secret from a request with the expected one in constant time. */
export function secretMatches(given: string | null, expected?: string) {
  if (!given || !expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * The scheduler's secret: "X-Cron-Secret: <secret>" (cron-job.org, which
 * doesn't pass a custom Authorization header through) or
 * "Authorization: Bearer <secret>" (GitHub Actions).
 */
export function cronSecret(headers: Headers) {
  return (
    headers.get("x-cron-secret") ??
    headers.get("authorization")?.replace(/^Bearer /, "") ??
    null
  );
}
