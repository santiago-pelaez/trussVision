const CACHE_NAME = 'vetin-cache-v59';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './common.css',
  './desktop-layout.css',
  './mobile-layout.css',
  './controls-3d.css',
  './main.js',
  './setup.js',
  './model.js',
  './localization.js',
  './translations.js',
  './translations-learning.js',
  './translations-i18n.js',
  './ui-handler.js',
  './learning-panel.js',
  './solution-steps.js',
  './practice.js',
  './cut-method.js',
  './fullscreen-panels.js',
  './app.js',
  './solver.js',
  './calculations.js',
  './draw-structure.js',
  './draw-loads.js',
  './draw-utilities.js',
  './download.js',
  './actions.js',
  './load-dialog.js',
  './desktop-events.js',
  './mobile-events.js',
  './elastic-3d.js',
  './models-gallery.js',
  './models/models-data.js',
  './vendor/chart.umd.min.js',
  './vendor/three.min.js',
  './vendor/OrbitControls.js',
  './logo.svg',
  './icon.svg',
  './IUC.svg',
  './icon-192.png',
  './icon-512.png',
  './vetin-ai-bridge.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response.ok && (response.type === 'basic' || response.type === 'cors')) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => Response.error());
    })
  );
});
