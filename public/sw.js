const CACHE = "agenda-turnos-v1";
const PRECACHE = ["./index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // Navegaciones (SPA con HashRouter): red primero, caché como respaldo offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copia = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copia));
          return response;
        })
        .catch(() => caches.match(PRECACHE[0]))
    );
    return;
  }

  // Activos estáticos: caché primero con red de respaldo.
  event.respondWith(
    caches.match(request).then(
      (enCache) =>
        enCache ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copia = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copia));
          }
          return response;
        })
    )
  );
});