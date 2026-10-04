// Bundles React for the code editor's live preview into public/vendor, so
// React lessons don't depend on a third-party CDN. The development build is
// used on purpose: its warnings (like missing `key` props) teach learners.
// The bundle also brings the in-memory WebSocket network (src/lib/runner/
// ws-shim.ts), so a page can run a `ws` server and its clients together.
// Runs before `next dev` / `next build`; tests call buildReactVendor().
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { buildSync, transformSync } from "esbuild";

import {
  pgliteDir,
  pgliteVendorName,
  reactTypePackages,
  reactTypesVendorName,
  reactVendorName,
  reactVersion,
} from "./vendor-name.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export { reactVersion };
export const reactVendorFile = join(root, "public", "vendor", reactVendorName);

const entry = `
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as ReactDOMClient from "react-dom/client";
import { createWsNetwork } from "./src/lib/runner/ws-shim.ts";
const asModule = (m) => Object.assign({}, m, { default: m, __esModule: true });
window.React = React;
window.ReactDOM = Object.assign({}, ReactDOM, ReactDOMClient);
window.__pandaModules = {
  react: asModule(React),
  "react-dom": asModule(ReactDOM),
  "react-dom/client": asModule(ReactDOMClient),
};
// WebSocket deliveries are counted so checks can wait for them (__settle).
// A MessageChannel delivers each one as its own task, without the 4 ms
// minimum of nested setTimeout(0) calls.
let wsPending = 0;
const deliveries = [];
const deliverNext = () => {
  const deliver = deliveries.shift();
  wsPending--;
  if (deliver) deliver();
};
// (jsdom, which our tests use, has no MessageChannel.)
const channel =
  typeof MessageChannel === "function" ? new MessageChannel() : null;
if (channel) channel.port1.onmessage = deliverNext;
const network = createWsNetwork((fn) => {
  wsPending++;
  deliveries.push(fn);
  if (channel) channel.port2.postMessage(null);
  else setTimeout(deliverNext, 0);
});
window.WebSocket = network.WebSocket;
window.__pandaModules.ws = network.ws;
window.__pandaWsPending = () => wsPending;
`;

export function buildReactVendor({ force = false } = {}) {
  if (!force && existsSync(reactVendorFile)) return reactVendorFile;
  mkdirSync(dirname(reactVendorFile), { recursive: true });
  buildSync({
    stdin: { contents: entry, resolveDir: root, loader: "js" },
    bundle: true,
    format: "iife",
    minify: true,
    target: "es2020",
    define: { "process.env.NODE_ENV": '"development"' },
    legalComments: "none",
    outfile: reactVendorFile,
    logLevel: "warning",
  });
  return reactVendorFile;
}

// The TypeScript compiler and its lib files for the editor's type checker
// (src/lib/runner/typecheck.worker.ts), served by this site rather than a
// CDN. The compiler is minified on the way (9 MB → about 3.5 MB).
const require = createRequire(import.meta.url);
const typescriptLib = dirname(require.resolve("typescript/lib/typescript.js"));
export const typescriptVersion = require("typescript/package.json").version;
export const typescriptVendorDir = join(
  root,
  "public",
  "vendor",
  `typescript-${typescriptVersion}`,
);

export function buildTypeScriptVendor({ force = false } = {}) {
  const compiler = join(typescriptVendorDir, "typescript.js");
  if (!force && existsSync(compiler)) return typescriptVendorDir;
  mkdirSync(typescriptVendorDir, { recursive: true });
  const { code } = transformSync(
    readFileSync(join(typescriptLib, "typescript.js"), "utf8"),
    // A classic script declaring a global `ts`: keep top-level names.
    { minify: true, legalComments: "none", target: "es2020" },
  );
  writeFileSync(compiler, code);
  for (const file of readdirSync(typescriptLib)) {
    if (/^lib\..*\.d\.ts$/.test(file)) {
      copyFileSync(join(typescriptLib, file), join(typescriptVendorDir, file));
    }
  }
  return typescriptVendorDir;
}

/**
 * React's type declarations (@types/react, @types/react-dom and csstype),
 * which the browser's type checker loads for TSX lessons. Same paths as
 * REACT_TYPE_FILES in src/lib/runner/typecheck.ts.
 */
export const reactTypesVendorDir = join(
  root,
  "public",
  "vendor",
  reactTypesVendorName,
);

export function buildReactTypesVendor({ force = false } = {}) {
  if (!force && existsSync(reactTypesVendorDir)) return reactTypesVendorDir;
  for (const [name, dir] of Object.entries(reactTypePackages)) {
    mkdirSync(join(reactTypesVendorDir, name), { recursive: true });
    for (const file of readdirSync(dir)) {
      if (file.endsWith(".d.ts")) {
        copyFileSync(join(dir, file), join(reactTypesVendorDir, name, file));
      }
    }
  }
  return reactTypesVendorDir;
}

/**
 * PGlite (PostgreSQL in WebAssembly) for SQL lessons. The SQL worker imports
 * it from here instead of from the bundle: PGlite finds its .wasm and .data
 * files next to its own script, and bundling it breaks that. Only what the
 * browser needs is copied (no source maps, CommonJS or extensions).
 */
export const pgliteVendorDir = join(root, "public", "vendor", pgliteVendorName);

export function buildPgliteVendor({ force = false } = {}) {
  if (!force && existsSync(join(pgliteVendorDir, "index.js"))) {
    return pgliteVendorDir;
  }
  const dist = join(pgliteDir, "dist");
  for (const folder of ["", "fs"]) {
    mkdirSync(join(pgliteVendorDir, folder), { recursive: true });
    for (const file of readdirSync(join(dist, folder))) {
      if (/\.(js|wasm|data)$/.test(file)) {
        copyFileSync(
          join(dist, folder, file),
          join(pgliteVendorDir, folder, file),
        );
      }
    }
  }
  return pgliteVendorDir;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  console.log(`Built ${buildReactVendor({ force: true })}`);
  console.log(`Built ${buildTypeScriptVendor({ force: true })}`);
  console.log(`Built ${buildReactTypesVendor({ force: true })}`);
  console.log(`Built ${buildPgliteVendor({ force: true })}`);
}
