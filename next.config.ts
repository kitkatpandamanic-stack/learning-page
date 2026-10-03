import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import createNextIntlPlugin from "next-intl/plugin";

import { reactVendorName } from "./scripts/vendor-name.mjs";

// Translations: messages are loaded by src/i18n/request.ts.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// React for the code editor's preview pages (built by scripts/build-vendor.mjs
// from node_modules/react, which isn't the React copy Next.js runs on).
const reactVendor = `/vendor/${reactVendorName}`;

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_REACT_VENDOR: reactVendor },
  // Lesson bodies are read from disk (src/lib/lesson-body.ts).
  outputFileTracingIncludes: {
    "/[locale]/learn/[lang]/[lesson]": ["./.velite/bodies/**/*"],
  },
};

// Lesson content comes from Velite: `npm run dev` runs it in watch mode in
// its own process (scripts/dev.mjs); builds run `velite build` first.

// Sentry error reporting (see src/instrumentation*.ts). With SENTRY_AUTH_TOKEN,
// SENTRY_ORG and SENTRY_PROJECT set, builds upload source maps so errors
// point at real code lines; without them nothing is uploaded.
export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  silent: !process.env.CI,
  telemetry: false,
});
