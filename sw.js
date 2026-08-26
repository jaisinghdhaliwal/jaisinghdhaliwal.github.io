const CACHE_NAME = "jai-portfolio-v77";
const OFFLINE_URL = "./offline.html";
const APP_SHELL = [
  "./",
  "./index.html",
  "./create.html",
  "./about.html",
  OFFLINE_URL,
  "./styles.css",
  "./app.js",
  "./projects.json",
  "./project.css",
  "./project.js",
  "./projects/degree-show.html",
  "./projects/gadjet-packaging.html",
  "./projects/justdesign-show.html",
  "./projects/gadjet-displays.html",
  "./logo/logo-01.svg",
  "./media/hero/showreel-thumb.avif",
  "./media/hero/showreel-thumb.webp",
  "./fonts/Poppins-400.woff2",
  "./fonts/Poppins-700.woff2",
  "./fonts/fira-code.woff2",
  "./ios_pwa/icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.headers.has("range") || ["video", "audio"].includes(request.destination)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => (await caches.match(request)) || caches.match(OFFLINE_URL))
    );
    return;
  }

  if (url.pathname.endsWith("/media/hero/showreel-thumb.avif") || url.pathname.endsWith("/media/hero/showreel-thumb.webp")) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
    return;
  }

  if (request.destination === "image" || url.pathname.endsWith("/projects.json")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fresh = fetch(request).then((response) => {
          if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          return response;
        });
        return cached || fresh;
      })
    );
    return;
  }

  if (["style", "script", "font"].includes(request.destination)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});
