// Bundles React for the code editor's live preview into public/vendor, so
// React lessons don't depend on a third-party CDN. The development build is
// used on purpose: its warnings (like missing `key` props) teach learners.
// The bundle also brings the in-memory WebSocket network (src/lib/runner/
// ws-shim.ts), so a page can run a `ws` server and its clients together.
// Runs before `next dev` / `next build`; tests call buildReactVendor().
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { buildSync } from "esbuild";

import { reactVendorName, reactVersion } from "./vendor-name.mjs";

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

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  console.log(`Built ${buildReactVendor({ force: true })}`);
}
