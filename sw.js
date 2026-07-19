/* Service worker — Espace Mariés GuillaumEvent (PWA)
   Rôle : rendre l'espace mariés installable et consultable hors-ligne.
   ⚠️ Il ne doit JAMAIS interférer avec les autres pages ni avec les appels
   à la base de données. */

const CACHE = 'ge-espace-v2';
const SHELL = [
  'espace-maries.html',
  'design-tokens.css',
  'supabase-config.js',
  'assets/logo-icon.png',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'manifest.webmanifest'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1) On ne touche PAS à ce qui vient d'ailleurs (Supabase, CDN, polices…)
  if (url.origin !== self.location.origin) return;

  // 2) On ne met jamais en cache les appels d'API
  if (url.pathname.startsWith('/rest/') || url.pathname.startsWith('/auth/')) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        // Copie en cache uniquement les réponses valides
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => {
          if (hit) return hit;
          // Repli hors-ligne réservé à l'espace mariés — jamais aux autres pages
          if (req.mode === 'navigate' && url.pathname.includes('espace-maries')) {
            return caches.match('espace-maries.html');
          }
          return Response.error();
        })
      )
  );
});
