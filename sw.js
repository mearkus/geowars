const CACHE_NAME = 'geowars-v1';

const CORE_ASSETS = [
  './',
  'manifest.json',
  'icon.svg',
];

const CDN_ASSETS = [
  'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_ASSETS);
    // Cache CDN scripts best-effort so install doesn't fail if a CDN is unreachable
    await Promise.allSettled(CDN_ASSETS.map(url => cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const { request } = event;

  // Let non-GET and WebRTC/Supabase API calls pass through untouched
  if (request.method !== 'GET') return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Navigation: network-first so the game auto-updates, fall back to cached shell
    if (request.mode === 'navigate') {
      try {
        const fresh = await fetch(request);
        cache.put(request, fresh.clone());
        return fresh;
      } catch {
        return cache.match('./') ?? cache.match('index.html');
      }
    }

    // Everything else: cache-first (CDN scripts, assets)
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    } catch {
      return new Response('Offline', { status: 503 });
    }
  })());
});
