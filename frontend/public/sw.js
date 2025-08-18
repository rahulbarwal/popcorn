// Service Worker for caching API responses and static assets
const CACHE_NAME = "inventory-dashboard-v1";
const API_CACHE_NAME = "inventory-dashboard-api-v1";

// Static assets to cache
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  // Add other static assets as needed
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/dashboard\/summary-metrics/,
  /\/api\/dashboard\/stock-levels/,
  /\/api\/dashboard\/warehouse-distribution/,
  /\/api\/dashboard\/recent-purchases/,
  /\/api\/dashboard\/stock-visualization/,
  /\/api\/products/,
  /\/api\/suppliers/,
];

// Cache duration in milliseconds
const CACHE_DURATION = {
  STATIC: 24 * 60 * 60 * 1000, // 24 hours
  API_SHORT: 5 * 60 * 1000, // 5 minutes
  API_MEDIUM: 15 * 60 * 1000, // 15 minutes
  API_LONG: 60 * 60 * 1000, // 1 hour
};

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching static assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );

  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch event - handle requests
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (request.method === "GET") {
    event.respondWith(handleStaticRequest(request));
  }
});

// Handle API requests with caching strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const cacheName = API_CACHE_NAME;

  // Check if this API endpoint should be cached
  const shouldCache = API_CACHE_PATTERNS.some((pattern) =>
    pattern.test(url.pathname)
  );

  if (!shouldCache) {
    // Don't cache, just fetch
    return fetch(request);
  }

  try {
    // Try cache first (stale-while-revalidate strategy)
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      const cacheDate = new Date(
        cachedResponse.headers.get("sw-cache-date") || 0
      );
      const now = new Date();
      const age = now.getTime() - cacheDate.getTime();

      // Determine cache duration based on endpoint
      let maxAge = CACHE_DURATION.API_MEDIUM;
      if (url.pathname.includes("summary-metrics")) {
        maxAge = CACHE_DURATION.API_SHORT;
      } else if (url.pathname.includes("stock-levels")) {
        maxAge = CACHE_DURATION.API_SHORT;
      } else if (url.pathname.includes("products")) {
        maxAge = CACHE_DURATION.API_LONG;
      }

      // If cache is still fresh, return it
      if (age < maxAge) {
        console.log("Serving from cache:", url.pathname);

        // Fetch in background to update cache
        fetchAndCache(request, cache);

        return cachedResponse;
      }
    }

    // Cache miss or expired - fetch from network
    console.log("Fetching from network:", url.pathname);
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Clone response for caching
      const responseToCache = networkResponse.clone();

      // Add cache timestamp
      const headers = new Headers(responseToCache.headers);
      headers.set("sw-cache-date", new Date().toISOString());

      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers,
      });

      // Cache the response
      cache.put(request, cachedResponse);
    }

    return networkResponse;
  } catch (error) {
    console.error("API request failed:", error);

    // Try to serve stale cache as fallback
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log("Serving stale cache as fallback:", url.pathname);
      return cachedResponse;
    }

    // Return error response
    return new Response(
      JSON.stringify({ error: "Network error and no cached data available" }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Handle static asset requests
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fetch from network
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error("Static request failed:", error);

    // Try to serve from cache as fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page or error
    return new Response("Offline", { status: 503 });
  }
}

// Background fetch and cache update
async function fetchAndCache(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const headers = new Headers(response.headers);
      headers.set("sw-cache-date", new Date().toISOString());

      const cachedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers,
      });

      cache.put(request, cachedResponse);
    }
  } catch (error) {
    console.error("Background fetch failed:", error);
  }
}

// Handle cache invalidation messages
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "INVALIDATE_CACHE") {
    const { pattern } = event.data;
    invalidateCache(pattern);
  }

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Invalidate cache by pattern
async function invalidateCache(pattern) {
  const cache = await caches.open(API_CACHE_NAME);
  const keys = await cache.keys();

  const keysToDelete = keys.filter((request) => {
    const url = new URL(request.url);
    return pattern.test(url.pathname);
  });

  await Promise.all(keysToDelete.map((key) => cache.delete(key)));
  console.log(
    `Invalidated ${keysToDelete.length} cache entries matching pattern:`,
    pattern
  );
}

// Periodic cache cleanup
setInterval(async () => {
  try {
    const cache = await caches.open(API_CACHE_NAME);
    const keys = await cache.keys();
    const now = new Date();

    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const cacheDate = new Date(response.headers.get("sw-cache-date") || 0);
        const age = now.getTime() - cacheDate.getTime();

        // Remove entries older than 1 hour
        if (age > CACHE_DURATION.API_LONG) {
          await cache.delete(request);
        }
      }
    }
  } catch (error) {
    console.error("Cache cleanup failed:", error);
  }
}, 30 * 60 * 1000); // Run every 30 minutes
