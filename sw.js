// Service worker for Kanji Nepali Flash
// Bump CACHE_NAME whenever kanji-flash.html (or any cached asset) changes,
// so users get the update instead of a stale cached copy.
const CACHE_NAME = 'kanji-flash-v1';

const APP_SHELL = [
  './kanji-flash.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

// Install: pre-cache the app shell so the flashcards work offline.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activate: drop any caches from a previous version of the app.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for app-shell files, with a network fallback that
// updates the cache in the background (stale-while-revalidate style).
// All kanji data itself lives in localStorage, not the cache, so editing
// or importing kanji works the same online or offline.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached); // offline: fall back to whatever is cached

      return cached || networkFetch;
    })
  );
});
