const CACHE_NAME = 'maxcafe-v2';
const DATA_CACHE_NAME = 'maxcafe-data-v1';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/assets/main.js',
    '/assets/styles.css',
    '/modules/admin.js',
    '/modules/analytics.js',
    '/modules/carousel.js',
    '/modules/data.js',
    '/modules/filters.js',
    '/modules/github-api.js',
    '/modules/i18n.js',
    '/modules/image-optimizer.js',
    '/modules/pwa.js',
    '/modules/render.js',
    '/modules/utils.js',
    '/manifest.json',
    'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;800&display=swap',
    'https://cdn.tailwindcss.com'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Install');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[ServiceWorker] Caching app shell');
            return cache.addAll(STATIC_ASSETS.map(url => {
                // Handle external URLs
                if (url.startsWith('http')) {
                    return new Request(url, { mode: 'no-cors' });
                }
                return url;
            })).catch(err => {
                console.warn('[ServiceWorker] Some assets failed to cache:', err);
            });
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activate');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
                        console.log('[ServiceWorker] Removing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip chrome-extension and other non-http requests
    if (!request.url.startsWith('http')) {
        return;
    }

    // Handle API requests (GitHub API)
    if (url.origin === 'https://api.github.com' || url.origin === 'https://raw.githubusercontent.com') {
        event.respondWith(
            caches.open(DATA_CACHE_NAME).then((cache) => {
                return fetch(request)
                    .then((response) => {
                        // Clone and cache successful responses
                        if (response.status === 200) {
                            cache.put(request, response.clone());
                        }
                        return response;
                    })
                    .catch(() => {
                        // Return cached version if network fails
                        return cache.match(request);
                    });
            })
        );
        return;
    }

    // Handle image requests with optimization
    if (request.destination === 'image') {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(request).then((response) => {
                    // Cache images for offline use
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                }).catch(() => {
                    // Return a placeholder image if offline
                    return new Response(
                        '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="300" fill="#1a1b1f"/><text x="50%" y="50%" text-anchor="middle" fill="#11c5c6" font-size="16">تصویر در دسترس نیست</text></svg>',
                        { headers: { 'Content-Type': 'image/svg+xml' } }
                    );
                });
            })
        );
        return;
    }

    // Default: Cache-first strategy for static assets
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(request).then((response) => {
                // Don't cache non-successful responses
                if (!response || response.status !== 200 || response.type === 'error') {
                    return response;
                }

                // Clone and cache the response
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, responseClone);
                });

                return response;
            }).catch(() => {
                // Return offline page for navigation requests
                if (request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            });
        })
    );
});

// Background sync for admin changes (future enhancement)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-menu') {
        event.waitUntil(
            // Sync menu data when back online
            console.log('[ServiceWorker] Background sync triggered')
        );
    }
});

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'منوی جدید موجود است!',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        dir: 'rtl',
        lang: 'fa'
    };

    event.waitUntil(
        self.registration.showNotification('کافه مکس', options)
    );
});
