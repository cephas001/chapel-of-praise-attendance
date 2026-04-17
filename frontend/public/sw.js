// public/sw.js

self.addEventListener("push", function (event) {
  if (!event.data) return;

  const payload = event.data.json();
  const title = payload.title || "New Message";

  const options = {
    body: payload.body,
    icon: "/favicon.ico", // Update this to your actual app icon path if different (e.g., '/icon-192x192.png')
    badge: "/favicon.ico",
    vibrate: [200, 100, 200, 100, 200], // 📱 Native Device Vibration Pattern!
    data: payload.data,
  };

  event.waitUntil(
    // 1. Show the native OS notification
    self.registration.showNotification(title, options).then(() => {
      // 2. Find any open tabs of your app and tell them to play the audio
      return self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "PLAY_NOTIFICATION_SOUND",
              payload: payload,
            });
          });
        });
    }),
  );
});

// Handle what happens when the user taps the notification
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((windowClients) => {
      // If they already have the app open, focus that tab
      if (windowClients.length > 0) {
        windowClients[0].focus();
      } else {
        // Otherwise, open the app
        self.clients.openWindow("/");
      }
    }),
  );
});
