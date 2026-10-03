/* Guarda o app no aparelho para abrir sem internet.
   Ao publicar uma versão nova do index.html, troque o número abaixo. */
const CACHE = "treino-v1";
const ARQUIVOS = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const fonte = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (url.origin !== self.location.origin && !fonte) return;

  const guarda = (res) => {
    if (res && (res.ok || res.type === "opaque")) {
      const copia = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copia));
    }
    return res;
  };

  // Responde do que está guardado e atualiza em segundo plano.
  e.respondWith(
    caches.match(req, { ignoreSearch: req.mode === "navigate" }).then((achado) => {
      const rede = fetch(req).then(guarda).catch(() => achado || caches.match("./index.html"));
      if (achado) { e.waitUntil(rede); return achado; }
      return rede;
    })
  );
});
