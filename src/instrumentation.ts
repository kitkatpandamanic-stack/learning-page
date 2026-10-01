import * as Sentry from "@sentry/nextjs";

import { sentryOptions } from "@/lib/sentry-options";

/** Reports server errors to Sentry; off until a Sentry DSN is set. */
export function register() {
  Sentry.init({
    ...sentryOptions,
    environment: process.env.VERCEL_ENV ?? "development",
  });
}

export const onRequestError = Sentry.captureRequestError;
