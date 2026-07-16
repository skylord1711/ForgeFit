const CACHE = 'forgefit-v2';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/index.js',
  '/src/app.js',
  '/src/db.js',
  '/src/router.js',
  '/src/utils/time.js',
  '/src/utils/helpers.js',
  '/src/utils/haptics.js',
  '/src/styles/main.css',
  '/src/styles/animations.css',
  '/src/components/bottom-nav.js',
  '/src/components/dashboard-modules.js',
  '/src/components/exercise-card.js',
  '/src/components/modal.js',
  '/src/components/timer.js',
  '/src/views/home.js',
  '/src/views/history.js',
  '/src/views/prs.js',
  '/src/views/settings.js',
  '/src/views/workout.js',
  '/src/views/choose-workout.js',
  '/src/views/exercise-detail.js',
  '/src/views/creatine.js',
  '/src/views/calendar.js',
  '/src/views/notes.js',
  '/src/views/manage-templates.js',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
