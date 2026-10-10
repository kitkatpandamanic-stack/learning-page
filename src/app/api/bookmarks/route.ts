import { listBookmarks } from "@/lib/learning";
import { getSession } from "@/lib/session";

/** The signed-in learner's saved permalinks, for the bookmark buttons. */
export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ signedIn: false, saved: [] });
  const rows = await listBookmarks(session.user.id);
  return Response.json(
    { signedIn: true, saved: rows.map((r) => r.permalink) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
