const CACHE_NAME = 'hospital-iot-v2';

// Install: precache app shell and static assets using registration scope
self.addEventListener('install', (event) => {
  const scope = self.registration.scope;
  const staticAssets = [
    scope,
    new URL('index.html', scope).href,
    new URL('manifest.webmanifest', scope).href,
    new URL('favicon.svg', scope).href,
    new URL('apple-touch-icon.png', scope).href,
    new URL('pwa-192x192.png', scope).href,
    new URL('pwa-512x512.png', scope).href,
    new URL('pwa-maskable-192x192.png', scope).href,
    new URL('pwa-maskable-512x512.png', scope).href
  ];

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(staticAssets).catch((err) => {
        console.warn('[SW] Pre-caching partial failure:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up older caches and claim clients
self.addEventListener('activate', (event) => {
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

// Fetch: Strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Bypass non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Bypass Firebase RTDB, Firestore, EmailJS, and external telemetry APIs
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('emailjs.com') ||
    url.hostname.includes('firebasestorage.googleapis.com') ||
    url.protocol.startsWith('ws')
  ) {
    return;
  }

  // For SPA navigation (HTML requests)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(new URL('index.html', self.registration.scope).href);
      })
    );
    return;
  }

  // For fonts, styles, scripts, images: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (networkResponse.type === 'basic' || networkResponse.type === 'cors')
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Push notification handling
self.addEventListener('push', (event) => {
  let data = {
    title: 'Hospital Emergency Alert',
    body: 'New sensor anomaly detected in hospital ward.',
    url: '/alerts',
    icon: '/pwa-192x192.png',
    badge: '/favicon.svg'
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/favicon.svg',
    vibrate: [200, 100, 200, 100, 400],
    data: {
      url: data.url || '/alerts'
    },
    actions: [
      { action: 'open_alerts', title: '🚨 View Alerts' }
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/alerts';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
