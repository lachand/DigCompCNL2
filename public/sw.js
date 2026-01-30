// Service Worker pour notifications push et cache
const CACHE_NAME = 'digcomp-v1.0.0'
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.webmanifest',
  '/offline.html'
]

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .then(() => {
        console.log('[SW] Static assets cached')
        return self.skipWaiting()
      })
  )
})

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker')
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('[SW] Service Worker activated')
      return self.clients.claim()
    })
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) return

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response
        }

        return fetch(event.request)
          .then(fetchResponse => {
            // Clone the response
            const responseClone = fetchResponse.clone()
            
            // Cache successful responses
            if (fetchResponse.status === 200) {
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseClone)
                })
            }
            
            return fetchResponse
          })
          .catch(() => {
            // Fallback to offline page for navigation requests
            if (event.request.destination === 'document') {
              return caches.match('/offline.html')
            }
          })
      })
  )
})

// Push notification event
self.addEventListener('push', event => {
  console.log('[SW] Push message received')
  
  let notificationData = {}
  
  if (event.data) {
    notificationData = event.data.json()
  }
  
  const title = notificationData.title || 'DigComp 3.0'
  const options = {
    body: notificationData.body || 'Nouvelle notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: notificationData.image,
    data: notificationData.data || {},
    actions: [
      {
        action: 'open',
        title: 'Ouvrir',
        icon: '/icons/action-open.png'
      },
      {
        action: 'dismiss',
        title: 'Ignorer',
        icon: '/icons/action-dismiss.png'
      }
    ],
    requireInteraction: notificationData.requireInteraction || false,
    silent: notificationData.silent || false,
    vibrate: notificationData.vibrate || [200, 100, 200],
    timestamp: Date.now()
  }
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked')
  
  event.notification.close()
  
  const action = event.action
  const data = event.notification.data
  
  if (action === 'dismiss') {
    return
  }
  
  // Default action or 'open' action
  let url = '/'
  
  if (data.url) {
    url = data.url
  } else if (data.type) {
    switch (data.type) {
      case 'chat':
        url = '/?chat=open'
        break
      case 'deadline':
        url = '/calendar'
        break
      case 'mention':
        url = `/outcomes/${data.domain}/${data.competence}`
        break
      case 'gamification':
        url = '/gamification'
        break
      case 'review':
        url = '/?reviews=open'
        break
      default:
        url = '/'
    }
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        // Check if there's already a window/tab open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              data: data,
              url: url
            })
            return client.focus()
          }
        }
        
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
  )
})

// Background sync event
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Sync pending actions when back online
      syncPendingActions()
    )
  }
})

// Sync pending actions function
async function syncPendingActions() {
  try {
    // Get pending actions from IndexedDB or similar
    const pendingActions = await getPendingActions()
    
    for (const action of pendingActions) {
      try {
        // Retry the action
        await retryAction(action)
        // Remove from pending if successful
        await removePendingAction(action.id)
      } catch (error) {
        console.log('[SW] Failed to sync action:', error)
      }
    }
  } catch (error) {
    console.log('[SW] Background sync failed:', error)
  }
}

// Helper functions (to be implemented based on your data layer)
async function getPendingActions() {
  // Implementation depends on your offline storage strategy
  return []
}

async function retryAction(action) {
  // Implementation depends on your API structure
  console.log('Retrying action:', action)
}

async function removePendingAction(id) {
  // Remove action from pending list
  console.log('Removing pending action:', id)
}

// Message event - handle messages from main thread
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})

// Firebase Messaging Configuration
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

// Configuration Firebase (mode par défaut: prod)
const getFirebaseConfig = () => {
  // En production, ces valeurs seront injectées par l'environnement
  return {
    apiKey: "AIzaSyDCUwRrVwqyKzRGHLK7QkBMKF5j3d8Xw2Y",  // Remplacez par votre clé
    authDomain: "digcomp-cnl2.firebaseapp.com",           // Remplacez par votre domaine
    projectId: "digcomp-cnl2",                           // Remplacez par votre project ID
    storageBucket: "digcomp-cnl2.appspot.com",           // Remplacez par votre bucket
    messagingSenderId: "123456789012",                    // Remplacez par votre sender ID
    appId: "1:123456789012:web:abcdef1234567890"          // Remplacez par votre app ID
  }
}

// Initialiser Firebase
firebase.initializeApp(getFirebaseConfig())

// Initialiser Firebase Messaging
const messaging = firebase.messaging()

// Gérer les messages en arrière-plan
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload)
  
  const notificationTitle = payload.notification?.title || 'DigComp CNL2'
  const notificationOptions = {
    body: payload.notification?.body || 'Vous avez reçu une nouvelle notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'digcomp-notification',
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'Ouvrir'
      },
      {
        action: 'close',
        title: 'Fermer'
      }
    ]
  }

  return self.registration.showNotification(notificationTitle, notificationOptions)
})

// Gérer les clics sur les notifications
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event)
  
  event.notification.close()
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})