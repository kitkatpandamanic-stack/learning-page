import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import { withSentryConfig } from "@sentry/nextjs/config";
import createNextIntlPlugin from "next-intl/plugin";

// Translations: messages are loaded by src/i18n/request.ts.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {};

async function config(phase: string): Promise<NextConfig> {
  // In dev, run Velite in watch mode alongside Next so content edits show up live.
  // Production builds run `velite build` first via the npm "build" script.
  if (phase === PHASE_DEVELOPMENT_SERVER && !process.env.VELITE_STARTED) {
    process.env.VELITE_STARTED = "1";
    const { build } = await import("velite");
    await build({ watch: true, clean: false });
  }
  return withNextIntl(nextConfig);
}

// Sentry error reporting (see src/instrumentation*.ts). With SENTRY_AUTH_TOKEN,
// SENTRY_ORG and SENTRY_PROJECT set, builds upload source maps so errors
// point at real code lines; without them nothing is uploaded.
export default withSentryConfig(config, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  silent: !process.env.CI,
  telemetry: false,
});
