// PLANNERPERF4 — cache-first Service Worker for external recipe/product images.
//
// Meal photos are never hosted on our own origin — they link directly to their
// original source (TheMealDB, BBC Good Food/Immediate, AllRecipes, OpenFoodFacts,
// and others, present and future). Those hosts send their own Cache-Control
// headers, but some are short (TheMealDB: 4 hours), and the browser's normal HTTP
// cache is still a per-origin, per-header deal that forgets fast. This cache is
// deliberately generic by REQUEST SHAPE rather than by a hardcoded host list, so a
// newly-imported recipe from a host we've never seen is covered automatically:
// any cross-origin request whose destination is an image is cache-first, full
// stop. Same-origin requests (the app's own bundle, API calls, local assets) are
// never touched here and always go to the network as normal.
//
// This never re-hosts or stores images as a permanent library asset — it is a
// rolling browser Cache Storage entry, evictable by the browser like any other
// cache, and entirely local to the visitor's own device. Bump CACHE_NAME to
// invalidate every cached image at once if that is ever needed.
const CACHE_NAME = "tha-recipe-images-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((name) => name !== CACHE_NAME && name.startsWith("tha-recipe-images-")).map((name) => caches.delete(name)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  if (request.destination !== "image") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin === self.location.origin) return; // our own images follow normal app caching

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        // Awaited deliberately: an un-awaited cache.put() races the browser's
        // decision that this fetch event is "done" once `response` is returned,
        // and the write to Cache Storage can be torn down mid-flight before it
        // finishes.
        //
        // These <img> tags have no `crossorigin` attribute, so every cross-origin
        // load here is in "no-cors" mode by default, and a no-cors response is
        // always OPAQUE: response.ok is always false and response.status is
        // always 0, by spec, even on a genuinely successful load — the browser
        // deliberately withholds that information cross-origin. Gating on
        // response.ok silently skipped every single cache write. Opaque
        // responses are cached unconditionally instead (the standard pattern for
        // this exact case); a request that was never going to succeed simply
        // caches an opaque failure once and is no worse off than today.
        if (response.ok || response.type === "opaque") await cache.put(request, response.clone());
        return response;
      } catch (err) {
        return cached || Response.error();
      }
    })
  );
});
