/**
 * A small sliding-window limiter: at most `limit` calls per `windowMs` for
 * each key (e.g. a user id). It lives in the server's memory, so on Vercel
 * each instance counts on its own: enough to stop a script hammering an
 * action, not a hard guarantee. (XP itself is capped by the content and
 * awarded once per activity, so the limit protects the database.)
 */
export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return function allow(key: string, now = Date.now()) {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    // Forget idle keys now and then so the map can't grow without end.
    if (hits.size > 10_000) {
      for (const [k, times] of hits) {
        if (times.every((t) => now - t >= windowMs)) hits.delete(k);
      }
    }
    return true;
  };
}
