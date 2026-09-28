// Offline gyorsítótár. Tartalomváltozáskor növeld a VERZIO értékét, hogy a telefonok frissítsenek.
var VERZIO = 'jv-v2';
var FAJLOK = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'manifest.webmanifest',
  'data/terkep.js',
  'data/radio.js',
  'data/elsosegely.js',
  'data/fegyver.js',
  'data/abv.js',
  'data/alaki.js',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERZIO).then(function (c) { return c.addAll(FAJLOK); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (kulcsok) {
    return Promise.all(kulcsok.filter(function (k) { return k !== VERZIO; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

// Hálózat először (friss tartalom), hiba esetén a gyorsítótárból.
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(function (valasz) {
      var masolat = valasz.clone();
      caches.open(VERZIO).then(function (c) { c.put(e.request, masolat); });
      return valasz;
    }).catch(function () {
      return caches.match(e.request, { ignoreSearch: true }).then(function (r) { return r || caches.match('index.html'); });
    })
  );
});
