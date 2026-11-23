const V = 'pindai-v1';
const LIB = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
const CORE = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V).then(c =>
      Promise.all([
        c.addAll(CORE),
        fetch(LIB).then(r => r.ok && c.put(LIB, r)).catch(() => {})
      ])
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const sameOrigin = new URL(req.url).origin === location.origin;
  if (!sameOrigin && req.url !== LIB) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      const net = fetch(req).then(r => {
        if (r && r.ok) { const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); }
        return r;
      }).catch(() => hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()));
      return hit || net;
    })
  );
});
