// PandaDev's service worker: keeps the heavy, never-changing files (Python,
// the TypeScript compiler, React, the site's hashed scripts and styles) after
// their first download, so the code editor starts instantly on later visits,
// and keeps the last copy of each lesson page so visited lessons open offline.
// Registered by src/components/layout/service-worker.tsx (production only).

const VERSION = "v2";
const RUNTIMES = `runtimes-${VERSION}`; // versioned URLs: cache first, forever
const PAGES = `pages-${VERSION}`; // network first, last copy for offline
const MAX_PAGES = 60;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name !== RUNTIMES && name !== PAGES) await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});

/** Files whose URL changes whenever their content does. */
function isImmutable(url) {
  return (
    (url.origin === self.location.origin &&
      (url.pathname.startsWith("/_next/static/") ||
        url.pathname.startsWith("/vendor/"))) ||
    // Pyodide and its packages: the version is in the path
    (url.origin === "https://cdn.jsdelivr.net" &&
      url.pathname.startsWith("/pyodide/v"))
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (isImmutable(url)) {
    event.respondWith(cacheFirst(request));
  } else if (
    request.mode === "navigate" &&
    url.origin === self.location.origin &&
    /^\/(ru\/)?learn\//.test(url.pathname)
  ) {
    event.respondWith(networkFirst(request));
  }
  // Everything else (API, sign-in, analytics) goes straight to the network.
});

async function cacheFirst(request) {
  const cache = await caches.open(RUNTIMES);
  const cached = await cache.match(request);
  if (cached) return forRequest(request, cached);
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

/**
 * Next.js starts every Web Worker from one script and tells them apart by
 * the #fragment of its URL. A cached response keeps the URL (and fragment)
 * it was first saved with, and a worker takes its location from the
 * response, so a second worker would start as the first one. A copy without
 * a URL makes each worker use its own.
 */
function forRequest(request, response) {
  if (request.destination !== "worker") return response;
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

async function networkFirst(request) {
  const cache = await caches.open(PAGES);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      await trim(cache);
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

/** Keeps only the most recently saved pages. */
async function trim(cache) {
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - MAX_PAGES))) {
    await cache.delete(key);
  }
}
