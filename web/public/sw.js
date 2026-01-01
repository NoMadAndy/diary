/* Simple offline-first service worker for SmartDiary
 * Note: Keep this file dependency-free (served from /public).
 */

const CACHE_NAME = 'smartdiary-v1'

const PRECACHE_URLS = [
  '/',
  '/entries',
  '/trips',
  '/changelog',
  '/sensors',
  '/manifest.webmanifest',
  '/icon.svg',
  '/maskable-icon.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      try {
        await cache.addAll(PRECACHE_URLS)
      } catch {
        // ignore: precache can fail during dev or when offline
      }
      self.skipWaiting()
    })()
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
      await self.clients.claim()
    })()
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)

  // Only handle same-origin
  if (url.origin !== self.location.origin) return

  // Navigations: network-first, fallback to cache
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req)
          const cache = await caches.open(CACHE_NAME)
          cache.put(req, res.clone())
          return res
        } catch {
          const cached = await caches.match(req)
          return cached || (await caches.match('/'))
        }
      })()
    )
    return
  }

  // Static assets: cache-first
  event.respondWith(
    (async () => {
      const cached = await caches.match(req)
      if (cached) return cached

      try {
        const res = await fetch(req)
        const cache = await caches.open(CACHE_NAME)
        // cache GET only
        if (req.method === 'GET' && res && res.status === 200) {
          cache.put(req, res.clone())
        }
        return res
      } catch {
        return cached
      }
    })()
  )
})
