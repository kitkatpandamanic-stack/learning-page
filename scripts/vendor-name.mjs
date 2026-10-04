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

/**
 * React's type packages for TypeScript lessons, by folder in the types
 * vendor folder (see REACT_TYPE_FILES in src/lib/runner/typecheck.ts).
 */
export const reactTypePackages = {
  react: join(root, "node_modules", "@types", "react"),
  "react-dom": join(root, "node_modules", "@types", "react-dom"),
  csstype: join(root, "node_modules", "csstype"),
};

const typesHash = createHash("sha256");
for (const dir of Object.values(reactTypePackages)) {
  typesHash.update(readFileSync(join(dir, "package.json")));
}

/** PostgreSQL in WebAssembly, for SQL lessons: served as-is from /vendor/pglite-<version>/. */
export const pgliteDir = join(root, "node_modules", "@electric-sql", "pglite");
export const pgliteVendorName = `pglite-${
  JSON.parse(readFileSync(join(pgliteDir, "package.json"), "utf8")).version
}`;

/** e.g. react-types-19.3.0-1a2b3c4d: a new folder whenever a package changes */
export const reactTypesVendorName = `react-types-${require("@types/react/package.json").version}-${typesHash.digest("hex").slice(0, 8)}`;
