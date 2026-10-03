import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import createNextIntlPlugin from "next-intl/plugin";

import {
  reactTypesVendorName,
  reactVendorName,
} from "./scripts/vendor-name.mjs";

// Translations: messages are loaded by src/i18n/request.ts.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// React for the code editor's preview pages (built by scripts/build-vendor.mjs
// from node_modules/react, which isn't the React copy Next.js runs on).
const reactVendor = `/vendor/${reactVendorName}`;

// Security headers for every response. The code editor runs learners' code
// (Web Workers, `new Function`, sandboxed preview pages that inherit this
// policy), so scripts may be inline and use eval; but they only load from
// this site and jsDelivr (Python and the TypeScript compiler), the site can't
// be framed, and plugins and <base> tricks are blocked.
const isDev = process.env.NODE_ENV === "development";
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob: https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline'",
  // Learners' pages may show any https image; GitHub avatars; charts are data: URLs
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // Learners' code may call real https APIs; Sentry; jsDelivr downloads
  `connect-src 'self' https:${isDev ? " ws: http://localhost:*" : ""}`,
  "worker-src 'self' blob:",
  "frame-src 'self' blob:",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // (No upgrade-insecure-requests: HSTS already keeps the site on https, and
  // it broke the production build served over http on localhost.)
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_REACT_VENDOR: reactVendor,
    // React's types, for type-checking TSX lessons (see build-vendor.mjs)
    NEXT_PUBLIC_REACT_TYPES: `/vendor/${reactTypesVendorName}`,
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // The service worker must always be fresh, so updates reach everyone.
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
      // Vendor files have a version or content hash in their name, so they
      // never change: browsers may keep them for a year.
      {
        source: "/vendor/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  // Lesson bodies are read from disk (src/lib/lesson-body.ts).
  outputFileTracingIncludes: {
    "/[locale]/learn/[lang]/[lesson]": ["./.velite/bodies/**/*"],
    "/[locale]/practice/[lang]/[problem]": ["./.velite/bodies/practice/**/*"],
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
