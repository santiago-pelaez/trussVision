// One-time migration worker for older root-level Vetin deployments.
// The active Vetin service worker now lives at /vetin/sw.js.
self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (event) => event.waitUntil(
  caches.keys()
    .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
    .then(() => self.registration.unregister())
    .then(() => self.clients.claim())
));
