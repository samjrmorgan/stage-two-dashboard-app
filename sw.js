// Stage Two Dashboard — service worker
// Handles Web Push events so notifications carry the app's own icon/branding
// instead of any third-party app's icon.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Network-first for navigations/HTML so the installed Home Screen app always
// tries to fetch the latest dashboard content first, only falling back to
// whatever's cached if the network request fails (e.g. offline).
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open("st-dash-v1").then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener("push", (event) => {
  let payload = { title: "Stage Two Media", body: "Dashboard update" };
  try {
    if (event.data) payload = Object.assign(payload, event.data.json());
  } catch (e) {
    // fall back to defaults if payload isn't JSON
  }

  const options = {
    body: payload.body,
    icon: "icons/icon-192.png",
    badge: "icons/icon-192.png",
    data: { url: payload.url || "./index.html" },
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "./index.html";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
