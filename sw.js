const CACHE = "hindi-book-shell-v2";
// index.html is deliberately NOT in this list — it must always be fetched fresh
// (network-first below) since new content gets pushed to it regularly. Only
// truly static assets are safe to cache-first.
const SHELL = ["./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // Supabase etc. — always straight to network, untouched

  const isPage = e.request.mode === "navigate" || url.pathname.endsWith("index.html") || url.pathname === "/" || url.pathname.endsWith("/hindi-book/");

  if (isPage) {
    // Network-first: always try to get the latest content. Only fall back to
    // whatever was last cached if there's genuinely no network (offline).
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  if (SHELL.some((f) => url.pathname.endsWith(f.replace("./", "")))) {
    e.respondWith(
      caches.match(e.request).then((cached) => cached || fetch(e.request))
    );
  }
});
