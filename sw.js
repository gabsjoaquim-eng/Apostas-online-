// Service Worker — Analyst
// Muda o número da versão aqui para forçar atualização em todos os dispositivos
const VERSION = "analyst-v1";

// Arquivos que ficam em cache para funcionar offline
const CACHE_FILES = [
  "./index.html",
  "./manifest.json"
];

// Instala e já ativa sem esperar
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(VERSION).then(cache => cache.addAll(CACHE_FILES))
  );
  self.skipWaiting();
});

// Remove caches antigos ao ativar
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estratégia: sempre tenta buscar do servidor primeiro (pega atualização do GitHub)
// Se não tiver rede, usa o cache
self.addEventListener("fetch", e => {
  // Chamadas da API da Anthropic: sempre online, nunca cacheia
  if (e.request.url.includes("api.anthropic.com")) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Google Fonts: cacheia mas sem bloquear
  if (e.request.url.includes("fonts.googleapis.com") || e.request.url.includes("fonts.gstatic.com")) {
    e.respondWith(
      caches.open("fonts-v1").then(cache =>
        cache.match(e.request).then(cached =>
          cached || fetch(e.request).then(resp => { cache.put(e.request, resp.clone()); return resp; })
        )
      )
    );
    return;
  }

  // index.html e outros arquivos: network first → cache fallback
  // Assim sempre pega a versão mais nova do GitHub
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        const clone = resp.clone();
        caches.open(VERSION).then(cache => cache.put(e.request, clone));
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
