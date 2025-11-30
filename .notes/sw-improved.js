/**
 * Improved Service Worker for FeastFit
 * Uses Network-First strategy to avoid stale cache issues
 * 
 * To enable: Register this in _app.tsx and update next.config.ts
 */

const CACHE_NAME = "feastfit-v2";
const STATIC_ASSETS = [
  "/",
  "/search",
  "/logs",
  "/login",
  "/coach",
];

// Install: Cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        // Only cache essential static assets, not API responses
        return cache.addAll(STATIC_ASSETS.filter(Boolean));
      })
      .then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: Network-first with cache fallback
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip API routes - always go to network
  if (url.pathname.startsWith("/api/")) {
    return; // Let Next.js handle API routes normally
  }

  // Skip external requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // For navigation requests (page loads), use Network-First
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone response for caching
          const responseClone = response.clone();
          
          // Cache successful responses
          if (response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request).then((cached) => {
            if (cached) {
              return cached;
            }
            // If no cache, return offline page or error
            return new Response("Offline - Please check your connection", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            });
          });
        })
    );
    return;
  }

  // For static assets (CSS, JS, images), use Stale-While-Revalidate
  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          // Update cache in background
          if (response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response.clone());
            });
          }
          return response;
        });

        // Return cached version immediately, update in background
        return cached || fetchPromise;
      })
    );
  }
});

