import { sentryOptions } from "@/lib/sentry-options";

/**
 * Loads the Sentry SDK on demand and starts it (once). Learners' own code
 * runs in Web Workers and sandboxed iframes, so mistakes in their exercises
 * never reach Sentry.
 */
export async function loadSentry() {
  const Sentry = await import("@sentry/nextjs");
  if (!Sentry.getClient()) {
    Sentry.init({
      ...sentryOptions,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
      // Browser extensions throw on many sites; those aren't our bugs.
      denyUrls: [/^(chrome|moz|safari(-web)?)-extension:\/\//],
      // Errors only: no "session" ping on every page view.
      integrations: (defaults) =>
        defaults.filter((integration) => integration.name !== "BrowserSession"),
    });
  }
  return Sentry;
}
