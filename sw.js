// COLOR MOMENT — Service Worker v2
// Compatibile con GitHub Pages subpath e Safari iOS
// Scopo: cache Firebase SDK (27KB) — caricamento istantaneo dal 2° accesso

const CACHE = ‘cm-v2’;
const PRECACHE = [
// Solo Firebase SDK — fan.html viene cachato dinamicamente al primo load
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