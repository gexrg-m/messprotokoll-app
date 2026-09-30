// Bei Aenderungen an der App diese Nummer erhoehen.
const CACHE = 'messprotokoll-v5';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

// Immer frisch vom Server laden (cache:'reload'), sonst landet eine alte Version im neuen Cache.
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(FILES.map(f => c.add(new Request(f, { cache: 'reload' })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Erst das Netz fragen (neueste Version), nur ohne Empfang den Zwischenspeicher nutzen.
const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
self.addEventListener('fetch', e => {
  if (e.request.url === CDN) {
    e.respondWith(caches.match(e.request).then(h => h || fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; })));
    return;
  }
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then(r => {
        if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); }
        return r;
      })
      .catch(() => caches.match(e.request).then(h => h || caches.match('./')))
  );
});
