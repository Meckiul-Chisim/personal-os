self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', event => {
  let message = {}
  try {
    message = event.data ? event.data.json() : {}
  } catch {
    message = { body: event.data?.text() || '' }
  }

  event.waitUntil(self.registration.showNotification(message.title || 'Personal OS reminder', {
    body: message.body || 'You have an upcoming event.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: { url: message.url || '/' },
  }))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const destination = new URL(event.notification.data?.url || '/', self.location.origin).href

  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    const existingClient = clients.find(client => client.url === destination)
    if (existingClient) return existingClient.focus()
    return self.clients.openWindow(destination)
  }))
})
