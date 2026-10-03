// Bundles React for the code editor's live preview into public/vendor, so
// React lessons don't depend on a third-party CDN. The development build is
// used on purpose: its warnings (like missing `key` props) teach learners.
// Runs before `next dev` / `next build`; tests call buildReactVendor().
import { existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { buildSync } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

export const reactVersion = require("react/package.json").version;
export const reactVendorFile = join(
  root,
  "public",
  "vendor",
  `react-${reactVersion}.js`,
);

const entry = `
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as ReactDOMClient from "react-dom/client";
const asModule = (m) => Object.assign({}, m, { default: m, __esModule: true });
window.React = React;
window.ReactDOM = Object.assign({}, ReactDOM, ReactDOMClient);
window.__pandaModules = {
  react: asModule(React),
  "react-dom": asModule(ReactDOM),
  "react-dom/client": asModule(ReactDOMClient),
};
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

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  console.log(`Built ${buildReactVendor({ force: true })}`);
}
