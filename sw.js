const CACHE_VERSION = 'v2';

self.addEventListener('install', (event) => {
    console.log('Service Worker: Installed successfully.');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activated and ready.');
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request).catch(() => {
        console.log("Network request failed, user might be offline.");
    }));
});
