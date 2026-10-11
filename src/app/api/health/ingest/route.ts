import { readSnapshot } from "@/lib/health";
import { saveSnapshot } from "@/lib/health-data";
import {
  pruneSecurityEvents,
  recordSecurityEvent,
  requester,
} from "@/lib/security-events";
import { secretMatches } from "@/lib/telegram/secret";

const MAX_BYTES = 64 * 1024;

/**
 * The health collector (.github/workflows/health.yml) sends what it found
 * outside the site here, with "Authorization: Bearer <CRON_SECRET>".
 * Its tokens for Vercel, Neon and Sentry stay on GitHub: the site only
 * ever gets the numbers.
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (
    !secretMatches(
      auth?.replace(/^Bearer /, "") ?? null,
      process.env.CRON_SECRET,
    )
  ) {
    recordSecurityEvent("bad-secret", "health-ingest", await requester());
    return new Response("Forbidden", { status: 403 });
  }
  const body = await request.text();
  if (body.length > MAX_BYTES)
    return new Response("Too large", { status: 413 });
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }
  const snapshot = readSnapshot(data);
  if (!snapshot) return new Response("Not a snapshot", { status: 400 });
  await saveSnapshot(snapshot);
  await pruneSecurityEvents();
  return Response.json({ ok: true });
}
