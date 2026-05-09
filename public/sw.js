// Service Worker — network first, sem cache de JS/CSS (evita versões travadas)
const CACHE_NAME = 'gss-academy-v6';
const STATIC_CACHE = ['/', '/manifest.json'];

self.addEventListener('install', (event) => {
  // Assume controle imediatamente sem esperar aba fechar
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Limpa TODOS os caches antigos
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // JS e CSS: sempre da rede, nunca do cache
  if (url.includes('/assets/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // APIs externas: passa direto
  if (
    url.includes('googleapis.com') ||
    url.includes('rss2json.com') ||
    url.includes('news.google.com') ||
    url.includes('firestore') ||
    url.includes('gemini')
  ) return;

  // Resto: network first, fallback para cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match('/'))
      )
  );
});
