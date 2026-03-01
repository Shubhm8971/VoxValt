// public/sw.js - VoxValt Service Worker
// Handles: Caching, Offline Support, Push Notifications, Background Sync

const CACHE_VERSION = 'v2'; // Incremented version
const CACHE_NAME = `voxvalt-${CACHE_VERSION}`;

// Assets to cache on install for offline support
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
];

// Routes that should NEVER be cached
const NEVER_CACHE = [
  '/api/',
  '/auth/',
  '/supabase/',
  'chrome-extension://',
  'extension://',
];

// Routes that should use cache-first strategy (static assets)
const CACHE_FIRST_PATTERNS = [
  /\.(js|css|woff2?|ttf|eot|ico)$/,
  /\/icons\//,
  /\/splash\//,
  /\//_next\/static\//,
];

// ============================================
// INSTALL - Cache static assets
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing VoxValt Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// ============================================
// ACTIVATE - Clean old caches
// ============================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('voxvalt-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ============================================
// FETCH - Smart caching strategies
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET') return;
  if (NEVER_CACHE.some((pattern) => url.pathname.startsWith(pattern) || url.href.includes(pattern))) return;
  if (url.origin !== self.location.origin) return;

  if (CACHE_FIRST_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(cacheFirst(request));
    return;
  }
  event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    updateCacheInBackground(request);
    return cached;
  }
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') return caches.match('/offline');
    return new Response('Offline', { status: 503 });
  }
}

async function updateCacheInBackground(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
  } catch (err) { }
}

// ============================================
// PUSH NOTIFICATIONS (MODIFIED FOR GEMINI)
// ============================================
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  let data = {};
  try {
    data = event.data?.json() || {};
  } catch (err) {
    data = {
      title: 'VoxValt Update',
      body: event.data?.text() || 'Check your daily dashboard.',
    };
  }

  // If the push comes from your cron job, 'type' will be 'briefing'
  const notificationType = data.type || 'briefing';
  const config = getNotificationConfig(notificationType, data);

  event.waitUntil(
    self.registration.showNotification(config.title, config.options)
  );
});

function getNotificationConfig(type, data) {
  const baseOptions = {
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || `voxvalt-${Date.now()}`,
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      type: type,
    },
  };

  switch (type) {
    case 'briefing':
      return {
        title: data.title || '☀️ Your Morning Briefing',
        options: {
          ...baseOptions,
          // Gemini's output goes here
          body: data.summary || data.body || 'Your personal summary is ready.',
          tag: 'morning-briefing',
          requireInteraction: true, // Keep it visible until they act
          data: {
            ...baseOptions.data,
            url: '/?showBriefing=true', // Tells Next.js to show the banner
          },
          actions: [
            { action: 'open', title: '📱 Read Now' },
            { action: 'dismiss', title: '👋 Later' },
          ],
        },
      };

    case 'promise':
      return {
        title: data.title || '🤝 Promise Kept?',
        options: {
          ...baseOptions,
          body: data.body,
          actions: [
            { action: 'complete', title: '✅ Done' },
            { action: 'open', title: '📱 View' },
          ],
        },
      };

    default:
      return {
        title: data.title || 'VoxValt',
        options: {
          ...baseOptions,
          body: data.body || 'New update available.',
          actions: [{ action: 'open', title: '📱 Open' }],
        },
      };
  }
}

// ============================================
// NOTIFICATION CLICK HANDLING
// ============================================
self.addEventListener('notificationclick', (event) => {
  const { notification, action } = event;
  const notificationData = notification.data || {};

  notification.close();

  if (action === 'dismiss') {
    event.waitUntil(trackAction('notification_dismissed', notificationData));
    return;
  }

  // Handle 'complete' for tasks, else open the URL
  if (action === 'complete') {
    event.waitUntil(handleCompleteAction(notificationData));
  } else {
    event.waitUntil(openApp(notificationData.url || '/'));
  }
});

async function openApp(url) {
  const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

  for (const client of windowClients) {
    const clientUrl = new URL(client.url);
    if (clientUrl.origin === self.location.origin) {
      await client.navigate(url);
      return client.focus();
    }
  }

  if (self.clients.openWindow) {
    return self.clients.openWindow(url);
  }
}

// ============================================
// BACKGROUND SYNC & PERIODIC SYNC
// ============================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-recordings') event.waitUntil(syncPendingRecordings());
});

// Periodic sync check for Chromium (Fallback if push fails)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'morning-briefing') {
    event.waitUntil(checkMorningBriefing());
  }
});

async function checkMorningBriefing() {
  const hour = new Date().getHours();
  if (hour < 8 || hour > 10) return;

  try {
    const response = await fetch('/api/briefing/summary');
    if (response.ok) {
      const data = await response.json();
      if (data.summary) {
        await self.registration.showNotification('☀️ Good Morning!', {
          body: data.summary,
          tag: 'morning-briefing',
          data: { url: '/?showBriefing=true' }
        });
      }
    }
  } catch (err) {
    console.error('[SW] Briefing fetch failed', err);
  }
}

// Helper methods (trackAction, handleCompleteAction, etc) should remain as you had them.
// ... (rest of your original helper functions)