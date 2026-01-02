'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { getAPIService, APIService } from './api'
import { getStorageService, StorageService } from './storage'
import type {
  User,
  Entry,
  Track,
  AppSettings,
  LocationState,
  CreateEntryRequest,
  CreateTrackRequest,
} from './types'
import { getDefaultApiUrl } from './types'

// App Context Types
interface AppContextType {
  // Auth
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  
  // Settings
  settings: AppSettings
  updateSettings: (settings: Partial<AppSettings>) => void
  
  // Entries
  entries: Entry[]
  loadEntries: () => Promise<void>
  createEntry: (entry: CreateEntryRequest) => Promise<void>
  
  // Tracks
  tracks: Track[]
  loadTracks: () => Promise<void>
  
  // Location
  location: LocationState
  startTracking: () => void
  stopTracking: () => Track['track_data']
  
  // Sync
  pendingCount: number
  isSyncing: boolean
  lastSyncDate: Date | null
  sync: () => Promise<void>
  
  // Services
  api: APIService
  storage: StorageService
  
  // Online status
  isOnline: boolean
}

const AppContext = createContext<AppContextType | null>(null)

// Default settings - apiBaseUrl wird dynamisch gesetzt
const defaultSettings: AppSettings = {
  apiBaseUrl: '', // Will be set dynamically in useEffect
  enableLocationTracking: true,
  enablePhotoAssignment: true,
  enableActivityDetection: false,
  enableWeather: true,
  enableAI: true,
  guideMode: 'compact',
  darkMode: 'system',
}

export function AppProvider({ children }: { children: ReactNode }) {
  // Services
  const [api] = useState(() => getAPIService())
  const [storage] = useState(() => getStorageService())
  
  // Auth state
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Settings
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  
  // Data
  const [entries, setEntries] = useState<Entry[]>([])
  const [tracks, setTracks] = useState<Track[]>([])
  
  // Location
  const [location, setLocation] = useState<LocationState>({
    isTracking: false,
    trackPoints: [],
  })
  const [watchId, setWatchId] = useState<number | null>(null)
  
  // Sync
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null)
  
  // Online status
  const [isOnline, setIsOnline] = useState(true)

  // Initialize
  useEffect(() => {
    const init = async () => {
      try {
        // Init storage
        await storage.init()
        
        // Load settings and determine API URL
        const savedSettings = await storage.getSetting<AppSettings>('settings', defaultSettings)
        
        // Use saved URL if valid, otherwise get dynamic default
        let apiUrl = savedSettings.apiBaseUrl
        if (!apiUrl || apiUrl === '' || apiUrl.includes('localhost')) {
          apiUrl = getDefaultApiUrl()
          console.log('Using dynamic API URL:', apiUrl)
        }
        
        // Ensure HTTPS if page is HTTPS
        if (typeof window !== 'undefined' && window.location.protocol === 'https:' && apiUrl.startsWith('http://')) {
          apiUrl = apiUrl.replace('http://', 'https://')
          console.log('Upgraded API URL to HTTPS:', apiUrl)
        }
        
        const finalSettings = { ...savedSettings, apiBaseUrl: apiUrl }
        setSettings(finalSettings)
        api.setBaseUrl(apiUrl)
        
        // Check auth
        const savedUser = localStorage.getItem('user')
        if (savedUser && savedUser !== 'undefined' && api.isAuthenticated()) {
          try {
            setUser(JSON.parse(savedUser))
          } catch (e) {
            console.error('Failed to parse saved user:', e)
            localStorage.removeItem('user')
          }
        }
        
        // Load cached data
        const cachedEntries = await storage.getCachedEntries()
        if (cachedEntries.length > 0) {
          setEntries(cachedEntries)
        }
        
        // Get pending count
        const count = await storage.getPendingCount()
        setPendingCount(count)
        
        // Load last sync date
        const lastSync = await storage.getSetting<string | null>('lastSyncDate', null)
        if (lastSync) {
          setLastSyncDate(new Date(lastSync))
        }
      } catch (error) {
        console.error('Init error:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    init()
    
    // Online status listeners
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [api, storage])

  // Auth functions
  const login = useCallback(async (email: string, password: string) => {
    const response = await api.login(email, password)
    setUser(response.user)
  }, [api])

  const logout = useCallback(() => {
    api.logout()
    setUser(null)
    setEntries([])
    setTracks([])
  }, [api])

  // Settings
  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    await storage.setSetting('settings', updated)
    
    if (newSettings.apiBaseUrl) {
      api.setBaseUrl(newSettings.apiBaseUrl)
    }
  }, [settings, storage, api])

  // Entries
  const loadEntries = useCallback(async () => {
    if (!api.isAuthenticated()) return
    
    try {
      const response = await api.getEntries(1, 100)
      setEntries(response.items)
      await storage.cacheEntries(response.items)
    } catch (error) {
      console.error('Failed to load entries:', error)
      // Fall back to cache
      const cached = await storage.getCachedEntries()
      setEntries(cached)
    }
  }, [api, storage])

  const createEntry = useCallback(async (entry: CreateEntryRequest) => {
    // Add location if available and enabled
    if (settings.enableLocationTracking && location.current) {
      entry.latitude = location.current.latitude
      entry.longitude = location.current.longitude
    }
    
    if (!isOnline || !api.isAuthenticated()) {
      // Save to pending queue
      await storage.addPendingEntry(entry)
      const count = await storage.getPendingCount()
      setPendingCount(count)
      return
    }
    
    try {
      const created = await api.createEntry(entry)
      setEntries(prev => [created, ...prev])
      await storage.cacheEntries([created, ...entries])
    } catch (error) {
      // Save to pending queue on error
      await storage.addPendingEntry(entry)
      const count = await storage.getPendingCount()
      setPendingCount(count)
      throw error
    }
  }, [api, storage, settings, location, isOnline, entries])

  // Tracks
  const loadTracks = useCallback(async () => {
    if (!api.isAuthenticated()) return
    
    try {
      const response = await api.getTracks(1, 100)
      setTracks(response.items)
      await storage.cacheTracks(response.items)
    } catch (error) {
      console.error('Failed to load tracks:', error)
      const cached = await storage.getCachedTracks()
      setTracks(cached)
    }
  }, [api, storage])

  // Location tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, error: 'Geolocation not supported' }))
      return
    }
    
    // Get current position first
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(prev => ({
          ...prev,
          current: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude ?? undefined,
            timestamp: position.timestamp,
          },
        }))
      },
      (error) => {
        setLocation(prev => ({ ...prev, error: error.message }))
      }
    )
    
    // Start watching
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const point = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          alt: position.coords.altitude ?? undefined,
          timestamp: position.timestamp,
        }
        
        setLocation(prev => ({
          ...prev,
          current: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude ?? undefined,
            timestamp: position.timestamp,
          },
          isTracking: true,
          trackPoints: [...prev.trackPoints, point],
          error: undefined,
        }))
      },
      (error) => {
        setLocation(prev => ({ ...prev, error: error.message }))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
    
    setWatchId(id)
    setLocation(prev => ({ ...prev, isTracking: true }))
  }, [])

  const stopTracking = useCallback((): Track['track_data'] => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    
    const trackPoints = location.trackPoints
    setLocation(prev => ({
      ...prev,
      isTracking: false,
      trackPoints: [],
    }))
    
    return trackPoints
  }, [watchId, location.trackPoints])

  // Sync
  const sync = useCallback(async () => {
    if (!api.isAuthenticated() || !isOnline || isSyncing) return
    
    setIsSyncing(true)
    
    try {
      // Sync pending entries
      const pendingEntries = await storage.getPendingEntries()
      for (const entry of pendingEntries) {
        try {
          const { localId, createdAt, ...entryData } = entry as any
          await api.createEntry(entryData)
          await storage.removePendingEntry(localId)
        } catch (error) {
          console.error('Failed to sync entry:', error)
        }
      }
      
      // Sync pending tracks
      const pendingTracks = await storage.getPendingTracks()
      for (const track of pendingTracks) {
        try {
          const { localId, createdAt, ...trackData } = track as any
          await api.createTrack(trackData)
          await storage.removePendingTrack(localId)
        } catch (error) {
          console.error('Failed to sync track:', error)
        }
      }
      
      // Reload data
      await loadEntries()
      await loadTracks()
      
      // Update pending count
      const count = await storage.getPendingCount()
      setPendingCount(count)
      
      // Update last sync date
      const now = new Date()
      setLastSyncDate(now)
      await storage.setSetting('lastSyncDate', now.toISOString())
    } catch (error) {
      console.error('Sync error:', error)
    } finally {
      setIsSyncing(false)
    }
  }, [api, storage, isOnline, isSyncing, loadEntries, loadTracks])

  const value: AppContextType = {
    // Auth
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    
    // Settings
    settings,
    updateSettings,
    
    // Entries
    entries,
    loadEntries,
    createEntry,
    
    // Tracks
    tracks,
    loadTracks,
    
    // Location
    location,
    startTracking,
    stopTracking,
    
    // Sync
    pendingCount,
    isSyncing,
    lastSyncDate,
    sync,
    
    // Services
    api,
    storage,
    
    // Online status
    isOnline,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

// Convenience hooks
export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout } = useApp()
  return { user, isAuthenticated, isLoading, login, logout }
}

export function useEntries() {
  const { entries, loadEntries, createEntry } = useApp()
  return { entries, loadEntries, createEntry }
}

export function useTracks() {
  const { tracks, loadTracks } = useApp()
  return { tracks, loadTracks }
}

export function useLocation() {
  const { location, startTracking, stopTracking, settings } = useApp()
  return { 
    location, 
    startTracking, 
    stopTracking,
    isEnabled: settings.enableLocationTracking,
  }
}

export function useSync() {
  const { pendingCount, isSyncing, lastSyncDate, sync, isOnline } = useApp()
  return { pendingCount, isSyncing, lastSyncDate, sync, isOnline }
}

export function useSettings() {
  const { settings, updateSettings } = useApp()
  return { settings, updateSettings }
}
