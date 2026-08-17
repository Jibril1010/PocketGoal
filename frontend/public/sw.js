self.addEventListener("push", (event) => {
  let payload = { title: "Pocket Goals", body: "You have a new notification." };
  try {
    payload = event.data.json();
  } catch {
    // ignore malformed payloads
  }
  event.waitUntil(self.registration.showNotification(payload.title, { body: payload.body }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
