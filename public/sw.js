// CoatchMaster PWA Service Worker
const CACHE_NAME = "coatchmaster-cache-v1";
const STATIC_ASSETS = [
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable.png",
  "/icons/apple-touch-icon.png",
  "/favicon.ico"
];

// Install: Cache static icons & manifest
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SW] Cache prefetch warning:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: Network First strategy (Live updates first, fallback to cache for offline/icons)
self.addEventListener("fetch", (event) => {
  // Do not intercept non-GET requests or Next.js development HMR
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  // Bypass API calls, authentication, and Next server actions entirely
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) {
    return;
  }

  // For static icons and manifest, Cache First is optimal
  if (url.pathname.startsWith("/icons/") || url.pathname === "/manifest.json") {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request);
      })
    );
    return;
  }

  // For everything else: Network First (always get live version so user changes show instantly)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        // Optional offline fallback
        return caches.match("/");
      })
  );
});
