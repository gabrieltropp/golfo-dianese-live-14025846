// Service worker minimo: non mette in cache nulla di suo (i dati devono
// sempre arrivare freschi), serve solo a rendere il sito "installabile"
// in modo più affidabile su Chrome/Android.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Nessuna intercettazione: tutte le richieste passano dritte alla rete.
});
