import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { after } from "next/server";
import { count, countDistinct, desc, gte, lt } from "drizzle-orm";

import { db } from "@/db";
import { securityEvent } from "@/db/schema";

/**
 * A small log of suspicious things for /admin/health. Writing never slows
 * down or breaks the request (it runs after the response), and the same
 * event from the same person is written at most once per 10 minutes, so a
 * script hammering an endpoint can't flood the table.
 */

export const SECURITY_EVENT_KINDS = [
  /** A rate limit refused someone (detail: which action) */
  "rate-limited",
  /** The report form's hidden field was filled in: a spam bot */
  "spam-trap",
  /** A wrong secret on the bot webhook, the cron endpoint or the collector */
  "bad-secret",
  /** A signed-in learner who isn't an admin opened an admin page */
  "admin-denied",
] as const;

export type SecurityEventKind = (typeof SECURITY_EVENT_KINDS)[number];

const QUIET_MS = 10 * 60_000;
const lastWritten = new Map<string, number>();

/** "u:<user id>" for signed-in people, otherwise a short hash of the IP. */
export async function requester(userId?: string | null) {
  if (userId) return `u:${userId}`;
  let h: Headers;
  try {
    h = await headers();
  } catch {
    return null; // outside a request
  }
  const ip = (
    h.get("x-vercel-forwarded-for") ??
    h.get("x-real-ip") ??
    h.get("x-forwarded-for") ??
    ""
  )
    .split(",")[0]
    .trim();
  if (!ip) return null;
  const salt = process.env.BETTER_AUTH_SECRET ?? "pandadev";
  return `ip:${createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 10)}`;
}

export function recordSecurityEvent(
  kind: SecurityEventKind,
  detail: string | null,
  who: string | null,
) {
  const key = `${kind}|${detail}|${who}`;
  const now = Date.now();
  if (now - (lastWritten.get(key) ?? 0) < QUIET_MS) return;
  lastWritten.set(key, now);
  if (lastWritten.size > 5_000) {
    for (const [k, t] of lastWritten)
      if (now - t >= QUIET_MS) lastWritten.delete(k);
  }
  const write = async () => {
    try {
      await db.insert(securityEvent).values({
        kind,
        detail: detail?.slice(0, 100) ?? null,
        who: who?.slice(0, 100) ?? null,
      });
    } catch {
      // Logging must never break the site.
    }
  };
  try {
    after(write);
  } catch {
    // Outside a request (scripts, tests): nothing to log.
  }
}

/** The last 24 hours by kind, and the 20 latest events of the last week. */
export async function getSecurityEvents() {
  const day = new Date(Date.now() - 86_400_000);
  const week = new Date(Date.now() - 7 * 86_400_000);
  const [byKind, latest] = await Promise.all([
    db
      .select({
        kind: securityEvent.kind,
        n: count(),
        people: countDistinct(securityEvent.who),
      })
      .from(securityEvent)
      .where(gte(securityEvent.createdAt, day))
      .groupBy(securityEvent.kind),
    db
      .select()
      .from(securityEvent)
      .where(gte(securityEvent.createdAt, week))
      .orderBy(desc(securityEvent.createdAt))
      .limit(20),
  ]);
  return {
    last24h: Object.fromEntries(
      SECURITY_EVENT_KINDS.map((kind) => {
        const row = byKind.find((r) => r.kind === kind);
        return [kind, { n: row?.n ?? 0, people: row?.people ?? 0 }];
      }),
    ) as Record<SecurityEventKind, { n: number; people: number }>,
    latest: latest.map((e) => ({
      kind: e.kind as SecurityEventKind,
      detail: e.detail,
      who: e.who,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}

/** Forgets events older than 30 days (called by the health collector). */
export async function pruneSecurityEvents() {
  await db
    .delete(securityEvent)
    .where(lt(securityEvent.createdAt, new Date(Date.now() - 30 * 86_400_000)));
}
