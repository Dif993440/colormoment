// COLOR MOMENT — Service Worker
// FIX: Mette in cache Firebase SDK e la pagina fan
// Dal secondo accesso: caricamento istantaneo anche offline

const CACHE = ‘colormoment-v1’;
const PRECACHE = [
‘/fan.html’,
‘https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js’,
‘https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js’,
];

// Installa e pre-cacha tutto al primo accesso
self.addEventListener(‘install’, e => {
e.waitUntil(
caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
);
self.skipWaiting();
});

self.addEventListener(‘activate’, e => {
// Rimuovi cache vecchie
e.waitUntil(
caches.keys().then(keys =>
Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
)
);
self.clients.claim();
});

// Cache-first per Firebase SDK (non cambia mai)
// Network-first per fan.html (potrebbe aggiornarsi)
self.addEventListener(‘fetch’, e => {
const url = e.request.url;

// Firebase SDK — sempre da cache se disponibile
if (url.includes(‘gstatic.com/firebasejs’)) {
e.respondWith(
caches.match(e.request).then(cached =>
cached || fetch(e.request).then(res => {
const clone = res.clone();
caches.open(CACHE).then(c => c.put(e.request, clone));
return res;
})
)
);
return;
}

// fan.html — network first, fallback cache
if (url.includes(‘fan.html’)) {
e.respondWith(
fetch(e.request)
.then(res => {
const clone = res.clone();
caches.open(CACHE).then(c => c.put(e.request, clone));
return res;
})
.catch(() => caches.match(e.request))
);
return;
}
});