const CACHE_NAME = "feastfit-shell-v1";
const SHELL_URLS = ["/", "/search", "/logs", "/login"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => (key === CACHE_NAME ? null : caches.delete(key)))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET navigations and same-origin requests.
  if (
    request.method !== "GET" ||
    new URL(request.url).origin !== self.location.origin
  ) {
    return;
  }

  // For navigation requests, use cache-first for the shell.
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match("/").then((cached) => cached || fetch(request))
    );
    return;
  }

  // For other same-origin GETs, just go to network (no aggressive caching of API/data).
});
