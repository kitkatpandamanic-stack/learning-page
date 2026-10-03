// The preview vendor file's name: React's version plus a hash of what goes
// into the bundle, so a changed bundle gets a new URL (no stale caches).
// Shared by scripts/build-vendor.mjs and next.config.ts.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

export const vendorSources = [
  join(root, "scripts", "build-vendor.mjs"),
  join(root, "src", "lib", "runner", "ws-shim.ts"),
];

export const reactVersion = require("react/package.json").version;

const hash = createHash("sha256");
for (const file of vendorSources) hash.update(readFileSync(file));

/** e.g. react-19.2.8-1a2b3c4d.js */
export const reactVendorName = `react-${reactVersion}-${hash.digest("hex").slice(0, 8)}.js`;
