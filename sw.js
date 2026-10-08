const CACHE = 'pdf2md-v13';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
const LIBS = [
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'];
// Si un CDN falla, la app se instala igualmente (antes fallaba toda la instalación)
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE).then(() => Promise.allSettled(LIBS.map(u => c.add(u))))));
});
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) return;
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    // Archivos propios: primero red (siempre la última versión), caché si no hay conexión
    e.respondWith(fetch(e.request).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
  } else {
    // Librerías, fuentes y datos del OCR: se guardan la primera vez para funcionar sin conexión
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    })));
  }
});
