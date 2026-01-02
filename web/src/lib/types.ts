/**
 * SmartDiary PWA - TypeScript Types
 * Entspricht den Models aus der iOS App
 */

// User model
export interface User {
  id: number
  email: string
  full_name?: string
  is_active: boolean
  created_at: string
}

// Auth response
export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

// Diary entry model
export interface Entry {
  id: number
  user_id: number
  title?: string
  content?: string
  latitude?: number
  longitude?: number
  location_name?: string
  mood?: string
  rating?: number
  tags: string[]
  weather?: Record<string, string>
  activity?: string
  ai_summary?: string
  ai_tags?: string[]
  entry_date: string
  created_at: string
  updated_at: string
}

// Create entry request
export interface CreateEntryRequest {
  content?: string
  title?: string
  latitude?: number
  longitude?: number
  location_name?: string
  mood?: string
  rating?: number
  tags?: string[]
  weather?: Record<string, string>
  activity?: string
  entry_date?: string
}

// Update entry request
export interface UpdateEntryRequest {
  title?: string
  content?: string
  latitude?: number
  longitude?: number
  location_name?: string
  mood?: string
  rating?: number
  tags?: string[]
  weather?: Record<string, string>
  activity?: string
}

// Track model for GPS recordings
export interface Track {
  id: number
  user_id: number
  entry_id?: number
  name?: string
  description?: string
  track_data: Array<{ lat: number; lng: number; alt?: number; timestamp?: number }>
  distance_meters?: number
  duration_seconds?: number
  elevation_gain?: number
  elevation_loss?: number
  max_elevation?: number
  min_elevation?: number
  avg_speed?: number
  started_at?: string
  ended_at?: string
  created_at: string
  updated_at: string
}

// Create track request
export interface CreateTrackRequest {
  name?: string
  description?: string
  track_data: Array<{ lat: number; lng: number; alt?: number; timestamp?: number }>
  entry_id?: number
  started_at?: string
  ended_at?: string
}

// Media file model
export interface Media {
  id: number
  user_id: number
  entry_id?: number
  filename: string
  original_filename?: string
  mime_type: string
  file_size?: number
  latitude?: number
  longitude?: number
  captured_at?: string
  created_at: string
  updated_at: string
}

// Paginated response
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

// Changelog models
export interface ChangelogVersion {
  version: string
  date?: string
  added: string[]
  changed: string[]
  fixed: string[]
  security: string[]
}

export interface ChangelogResponse {
  markdown: string
  versions: ChangelogVersion[]
}

// AI Guide response
export interface GuidePOIResponse {
  text: string
  pois?: Array<{
    name: string
    description: string
    latitude: number
    longitude: number
  }>
}

// AI Summary response
export interface AISummaryResponse {
  summary: string
  suggested_tags?: string[]
}

// App Settings
export interface AppSettings {
  apiBaseUrl: string
  enableLocationTracking: boolean
  enablePhotoAssignment: boolean
  enableActivityDetection: boolean
  enableWeather: boolean
  enableAI: boolean
  guideMode: 'off' | 'compact' | 'detailed'
  darkMode: 'system' | 'light' | 'dark'
}

// Sync state
export interface SyncState {
  pendingEntries: CreateEntryRequest[]
  pendingTracks: CreateTrackRequest[]
  lastSyncDate?: string
  isSyncing: boolean
}

// Location state
export interface LocationState {
  current?: {
    latitude: number
    longitude: number
    accuracy: number
    altitude?: number
    timestamp: number
  }
  isTracking: boolean
  trackPoints: Array<{ lat: number; lng: number; alt?: number; timestamp: number }>
  error?: string
}

// Mood options
export const MOOD_OPTIONS = [
  { value: 'happy', label: 'Glücklich', emoji: '😊' },
  { value: 'sad', label: 'Traurig', emoji: '😢' },
  { value: 'excited', label: 'Aufgeregt', emoji: '🤩' },
  { value: 'calm', label: 'Ruhig', emoji: '😌' },
  { value: 'tired', label: 'Müde', emoji: '😴' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
] as const

export type MoodValue = typeof MOOD_OPTIONS[number]['value']

// Helper function to get mood emoji
export function getMoodEmoji(mood?: string): string {
  if (!mood) return ''
  const option = MOOD_OPTIONS.find(m => 
    m.value.toLowerCase() === mood.toLowerCase() || 
    m.label.toLowerCase() === mood.toLowerCase()
  )
  return option?.emoji ?? '😐'
}

// Helper function to get default API URL based on current protocol
export function getDefaultApiUrl(): string {
  // Server-side or build-time: use env variable
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  }
  
  // Client-side: use same origin with /api prefix, or env variable
  const envUrl = process.env.NEXT_PUBLIC_API_URL
  
  // If env URL is set and not localhost, use it but ensure correct protocol
  if (envUrl && !envUrl.includes('localhost')) {
    // If page is HTTPS, force API to HTTPS too
    if (window.location.protocol === 'https:' && envUrl.startsWith('http://')) {
      return envUrl.replace('http://', 'https://')
    }
    return envUrl
  }
  
  // Default: same origin (works with reverse proxy setup)
  return window.location.origin
}

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  apiBaseUrl: '', // Will be set dynamically
  enableLocationTracking: true,
  enablePhotoAssignment: true,
  enableActivityDetection: false,
  enableWeather: true,
  enableAI: true,
  guideMode: 'compact',
  darkMode: 'system',
}
