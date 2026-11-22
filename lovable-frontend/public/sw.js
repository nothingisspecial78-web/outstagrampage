/**
 * Outstagram Progressive Web App Service Worker
 * Version: 1.0.0
 * Provides offline caching, PWA installability, and instant shell response.
 */

const CACHE_NAME = "outstagram-v1";
const STATIC_ASSETS = [
  "/",
  "/favicon.svg",
  "/favicon.ico",
  "/logo-192.png",
  "/logo-512.png",
  "/logo-maskable.png",
  "/logo.svg",
  "/manifest.webmanifest"
];

// Install: pre-cache static assets and skip waiting
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("PWA SW pre-cache partial:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clear older caches and claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first with cache fallback
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Ignore browser extensions or external non-http schemes
  if (!request.url.startsWith("http")) return;

  // Skip API, auth, or Supabase endpoints from caching
  if (request.url.includes("supabase.co") || request.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone and store valid responses in cache
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if offline
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If navigating pages offline, return root shell
          if (request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("Offline", { status: 503, statusText: "Offline" });
        });
      })
  );
});
