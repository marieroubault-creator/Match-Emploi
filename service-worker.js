const CACHE_NAME = "connect-emploi-v2";

const urlsToCache = [
  "./",
  "./index.html"
];

// Installation : on met en cache les fichiers de base
// et on force le nouveau SW à s'activer tout de suite (sans attendre la fermeture des onglets)
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Activation : on supprime les anciens caches (v1, etc.) et on prend le contrôle immédiatement
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// Stratégie "réseau d'abord" pour index.html : on essaie toujours d'avoir la dernière version en ligne,
// et on ne se rabat sur le cache que si le réseau échoue (mode hors-ligne).
// Pour les autres fichiers (icônes, etc.), on garde une logique cache d'abord.
self.addEventListener("fetch", event => {
  const isHTML = event.request.mode === "navigate" ||
    event.request.url.endsWith("index.html") ||
    event.request.url.endsWith("/");

  if (isHTML) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(response => response || fetch(event.request))
    );
  }
});
