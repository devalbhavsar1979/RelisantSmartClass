/**
 * Service Worker for Tuition Manager PWA
 * Handles caching, offline support, and background functionality
 */

// Cache version - update this when you want to invalidate caches
const CACHE_VERSION = 'tuition-manager-v1'
const CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json'
]

/**
 * Install Event
 * Called when service worker is first registered
 * Pre-caches essential resources
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...')
  
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log('[Service Worker] Caching core resources')
      return cache.addAll(CACHE_URLS)
    }).catch((error) => {
      console.error('[Service Worker] Cache installation error:', error)
    })
  )
  
  // Force the waiting service worker to become active
  self.skipWaiting()
})

/**
 * Activate Event
 * Called when service worker becomes active
 * Cleans up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_VERSION)
          .map((name) => {
            console.log('[Service Worker] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    })
  )
  
  // Claim all clients
  return self.clients.claim()
})

/**
 * Fetch Event
 * Intercepts all fetch requests
 * Uses network-first strategy for API calls, cache-first for assets
 */
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return
  }

  const { request } = event

  // Skip requests to Chrome extensions
  if (request.url.startsWith('chrome-extension://')) {
    return
  }

  // Use cache-first strategy for static assets
  if (
    request.url.includes('.js') ||
    request.url.includes('.css') ||
    request.url.includes('.png') ||
    request.url.includes('.jpg') ||
    request.url.includes('.jpeg') ||
    request.url.includes('.svg') ||
    request.url.includes('.webp') ||
    request.url.includes('.woff') ||
    request.url.includes('.woff2') ||
    request.url.includes('.ttf')
  ) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response
        }
        
        return fetch(request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response
          }

          // Clone the response
          const responseClone = response.clone()
          
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(request, responseClone)
          })

          return response
        }).catch(() => {
          // Return offline page or default response
          return caches.match(request) || new Response('Offline - Resource not cached')
        })
      })
    )
    return
  }

  // Use network-first strategy for navigation and API calls
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type === 'error') {
          return response
        }

        // Clone and cache
        const responseClone = response.clone()
        caches.open(CACHE_VERSION).then((cache) => {
          cache.put(request, responseClone)
        })

        return response
      })
      .catch(() => {
        // Return cached version or offline response
        return caches.match(request).then((response) => {
          if (response) {
            return response
          }

          // For navigation requests, return the index.html
          if (request.destination === 'document') {
            return caches.match('/index.html')
          }

          return new Response('Offline - Resource not available')
        })
      })
  )
})

/**
 * Message Event
 * Handles messages from clients
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Skip waiting requested')
    self.skipWaiting()
  }
})

/**
 * Background Sync Event (for future use)
 * Can be used to sync data when user comes back online
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Handle background sync here
      Promise.resolve()
    )
  }
})

console.log('[Service Worker] Ready to handle requests')
