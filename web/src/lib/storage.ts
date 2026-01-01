/**
 * SmartDiary PWA - IndexedDB Storage Service
 * Offline-Support für Einträge und Sync-Queue
 */

import type { CreateEntryRequest, CreateTrackRequest, Entry, Track } from './types'

const DB_NAME = 'smartdiary'
const DB_VERSION = 1

interface PendingEntry extends CreateEntryRequest {
  localId: string
  createdAt: string
}

interface PendingTrack extends CreateTrackRequest {
  localId: string
  createdAt: string
}

class StorageService {
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null

  async init(): Promise<void> {
    if (this.db) return
    if (this.initPromise) return this.initPromise

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        resolve()
        return
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error)
        resolve() // Don't reject, just continue without offline support
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Pending entries store
        if (!db.objectStoreNames.contains('pendingEntries')) {
          const entriesStore = db.createObjectStore('pendingEntries', { keyPath: 'localId' })
          entriesStore.createIndex('createdAt', 'createdAt', { unique: false })
        }

        // Pending tracks store
        if (!db.objectStoreNames.contains('pendingTracks')) {
          const tracksStore = db.createObjectStore('pendingTracks', { keyPath: 'localId' })
          tracksStore.createIndex('createdAt', 'createdAt', { unique: false })
        }

        // Cached entries store
        if (!db.objectStoreNames.contains('cachedEntries')) {
          const cachedStore = db.createObjectStore('cachedEntries', { keyPath: 'id' })
          cachedStore.createIndex('entry_date', 'entry_date', { unique: false })
        }

        // Cached tracks store
        if (!db.objectStoreNames.contains('cachedTracks')) {
          db.createObjectStore('cachedTracks', { keyPath: 'id' })
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' })
        }
      }
    })

    return this.initPromise
  }

  // MARK: - Pending Entries

  async addPendingEntry(entry: CreateEntryRequest): Promise<string> {
    await this.init()
    if (!this.db) return ''

    const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const pendingEntry: PendingEntry = {
      ...entry,
      localId,
      createdAt: new Date().toISOString(),
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingEntries'], 'readwrite')
      const store = transaction.objectStore('pendingEntries')
      const request = store.add(pendingEntry)

      request.onsuccess = () => resolve(localId)
      request.onerror = () => reject(request.error)
    })
  }

  async getPendingEntries(): Promise<PendingEntry[]> {
    await this.init()
    if (!this.db) return []

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingEntries'], 'readonly')
      const store = transaction.objectStore('pendingEntries')
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async removePendingEntry(localId: string): Promise<void> {
    await this.init()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingEntries'], 'readwrite')
      const store = transaction.objectStore('pendingEntries')
      const request = store.delete(localId)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // MARK: - Pending Tracks

  async addPendingTrack(track: CreateTrackRequest): Promise<string> {
    await this.init()
    if (!this.db) return ''

    const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const pendingTrack: PendingTrack = {
      ...track,
      localId,
      createdAt: new Date().toISOString(),
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingTracks'], 'readwrite')
      const store = transaction.objectStore('pendingTracks')
      const request = store.add(pendingTrack)

      request.onsuccess = () => resolve(localId)
      request.onerror = () => reject(request.error)
    })
  }

  async getPendingTracks(): Promise<PendingTrack[]> {
    await this.init()
    if (!this.db) return []

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingTracks'], 'readonly')
      const store = transaction.objectStore('pendingTracks')
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async removePendingTrack(localId: string): Promise<void> {
    await this.init()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingTracks'], 'readwrite')
      const store = transaction.objectStore('pendingTracks')
      const request = store.delete(localId)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // MARK: - Cached Entries

  async cacheEntries(entries: Entry[]): Promise<void> {
    await this.init()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cachedEntries'], 'readwrite')
      const store = transaction.objectStore('cachedEntries')

      entries.forEach(entry => {
        store.put(entry)
      })

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  async getCachedEntries(): Promise<Entry[]> {
    await this.init()
    if (!this.db) return []

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cachedEntries'], 'readonly')
      const store = transaction.objectStore('cachedEntries')
      const request = store.getAll()

      request.onsuccess = () => {
        const entries = request.result as Entry[]
        // Sort by entry_date descending
        entries.sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime())
        resolve(entries)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async clearCachedEntries(): Promise<void> {
    await this.init()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cachedEntries'], 'readwrite')
      const store = transaction.objectStore('cachedEntries')
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // MARK: - Cached Tracks

  async cacheTracks(tracks: Track[]): Promise<void> {
    await this.init()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cachedTracks'], 'readwrite')
      const store = transaction.objectStore('cachedTracks')

      tracks.forEach(track => {
        store.put(track)
      })

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  async getCachedTracks(): Promise<Track[]> {
    await this.init()
    if (!this.db) return []

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cachedTracks'], 'readonly')
      const store = transaction.objectStore('cachedTracks')
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // MARK: - Settings

  async setSetting<T>(key: string, value: T): Promise<void> {
    await this.init()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readwrite')
      const store = transaction.objectStore('settings')
      const request = store.put({ key, value })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    await this.init()
    if (!this.db) return defaultValue

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readonly')
      const store = transaction.objectStore('settings')
      const request = store.get(key)

      request.onsuccess = () => {
        resolve(request.result?.value ?? defaultValue)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // MARK: - Pending counts

  async getPendingCount(): Promise<number> {
    const entries = await this.getPendingEntries()
    const tracks = await this.getPendingTracks()
    return entries.length + tracks.length
  }
}

// Singleton instance
let storageInstance: StorageService | null = null

export function getStorageService(): StorageService {
  if (!storageInstance) {
    storageInstance = new StorageService()
  }
  return storageInstance
}

export { StorageService }
