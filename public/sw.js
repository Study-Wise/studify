const CACHE_NAME = 'studywise';
const urlsToCache = [
    '/',
    '/styles/globals.scss',
    '/assets/logos/favicon.png',
    '/assets/logos/logo.png',
    '/manifest.webmanifest'
];

// Install event - cache resources
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request)
            .then(response => {
                if (response) return response;
                return fetch(e.request);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
