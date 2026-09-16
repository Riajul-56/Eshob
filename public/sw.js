// Minimal service worker — required for the app to be installable.
// Network-first passthrough; caches the icons so the installed app has them.
const CACHE = "loyalty-v1";
const ASSETS = ["/icon-192.png", "/icon-512.png", "/apple-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (e) => {
  // pass through; fall back to cache for our icons if offline
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
