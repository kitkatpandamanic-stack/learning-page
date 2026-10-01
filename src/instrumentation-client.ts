import * as Sentry from "@sentry/nextjs";

import { sentryOptions } from "@/lib/sentry-options";

/**
 * Reports crashes in visitors' browsers to Sentry; off until
 * NEXT_PUBLIC_SENTRY_DSN is set. Learners' own code runs in Web Workers and
 * sandboxed iframes, so mistakes in their exercises never reach Sentry.
 */
Sentry.init({
  ...sentryOptions,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
  // Browser extensions throw on many sites; those aren't our bugs.
  denyUrls: [/^(chrome|moz|safari(-web)?)-extension:\/\//],
});
