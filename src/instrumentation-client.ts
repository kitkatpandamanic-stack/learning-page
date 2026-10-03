import { whenIdle } from "@/lib/idle";
import { loadSentry } from "@/lib/sentry-client";
import { sentryOptions } from "@/lib/sentry-options";

/**
 * Reports crashes in visitors' browsers to Sentry; off until
 * NEXT_PUBLIC_SENTRY_DSN is set. The SDK is fairly large, so it loads once
 * the page is idle instead of with the page (phones show lessons sooner);
 * the error page loads it itself if a crash comes first (global-error.tsx).
 */
if (sentryOptions.enabled) whenIdle(() => void loadSentry());
