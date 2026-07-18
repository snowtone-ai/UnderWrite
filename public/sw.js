// UnderWrite Service Worker
// Strategy:
//   /_next/static/* — cache-first (content-hashed filenames, safe to cache forever)
//   /api/*          — network-only (always fresh data)
//   navigation      — network-first with offline fallback to /offline
// Cache version: bump SW_VERSION to invalidate all caches on next deploy.
const SW_VERSION = "v1";
const STATIC_CACHE = `uw-static-${SW_VERSION}`;
const RUNTIME_CACHE = `uw-runtime-${SW_VERSION}`;

const PRECACHE_URLS = ["/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(RUNTIME_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // API — always network, never cache
  if (url.pathname.startsWith("/api/")) return;

  // Next.js static assets — content-hashed, cache forever
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ??
            fetch(request).then((res) => {
              if (res.ok) cache.put(request, res.clone());
              return res;
            }),
        ),
      ),
    );
    return;
  }

  // Navigation — network-first, offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .match(request)
          .then((cached) => cached ?? caches.match("/offline")),
      ),
    );
    return;
  }
});
