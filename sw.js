// This service worker intentionally does nothing except delete every cache
// it or its predecessor ever created, then unregister itself so the browser
// goes back to plain, uncached network requests for everything.
//
// Why: caching the app shell caused real, repeated problems (the app getting
// stuck showing an old version). This app needs a live connection to
// Supabase to do anything useful anyway, so there was never a real offline
// benefit worth that risk. Simplest fix: stop caching entirely.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll())
      .then((clients) => clients.forEach((client) => client.navigate(client.url)))
  );
});
