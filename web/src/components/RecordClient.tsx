'use client'

import { useState, useRef } from 'react'
import { useApp, useLocation, useSync } from '@/lib/context'
import { MOOD_OPTIONS, type CreateEntryRequest } from '@/lib/types'

export default function RecordClient() {
  const { isAuthenticated, createEntry, api } = useApp()
  const { location, startTracking, stopTracking, isEnabled: locationEnabled } = useLocation()
  const { pendingCount, isOnline } = useSync()

  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [tags, setTags] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedPhoto(file)
      const reader = new FileReader()
      reader.onload = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removePhoto = () => {
    setSelectedPhoto(null)
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleToggleTracking = () => {
    if (location.isTracking) {
      const trackData = stopTracking()
      console.log('Track stopped with', trackData.length, 'points')
    } else {
      startTracking()
    }
  }

  const handleSave = async () => {
    if (!content.trim() && !title.trim()) {
      setError('Bitte gib mindestens einen Inhalt oder Titel ein.')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const tagsList = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      const entry: CreateEntryRequest = {
        content: content.trim() || undefined,
        title: title.trim() || undefined,
        mood: selectedMood || undefined,
        tags: tagsList.length > 0 ? tagsList : undefined,
        entry_date: new Date().toISOString(),
      }

      // Add location if available
      if (locationEnabled && location.current) {
        entry.latitude = location.current.latitude
        entry.longitude = location.current.longitude
      }

      await createEntry(entry)

      // Upload photo if selected
      if (selectedPhoto && isOnline) {
        try {
          await api.uploadMedia(selectedPhoto)
        } catch (err) {
          console.error('Photo upload failed:', err)
        }
      }

      // Reset form
      setContent('')
      setTitle('')
      setSelectedMood(null)
      setTags('')
      removePhoto()
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="text-6xl mb-4">🔐</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Bitte anmelden
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Melde dich an um neue Einträge zu erstellen.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        ✨ Moment festhalten
      </h1>

      {/* Success Message */}
      {showSuccess && (
        <div className="p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-xl flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Dein Moment wurde gespeichert!
          {!isOnline && ' (wird synchronisiert wenn online)'}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-xl">
          {error}
        </div>
      )}

      {/* Pending Count */}
      {pendingCount > 0 && (
        <div className="p-3 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm">
          📤 {pendingCount} Einträge warten auf Synchronisation
        </div>
      )}

      {/* Title (optional) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Titel (optional)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="z.B. Wunderschöner Tag am See"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Was ist passiert?
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Schreibe hier deinen Moment auf..."
          rows={5}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Photo */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          📸 Foto
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoSelect}
          className="hidden"
        />
        
        {photoPreview ? (
          <div className="relative">
            <img
              src={photoPreview}
              alt="Vorschau"
              className="w-full max-h-64 object-contain rounded-lg"
            />
            <button
              onClick={removePhoto}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 transition-colors flex flex-col items-center justify-center text-gray-500 dark:text-gray-400"
          >
            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Foto hinzufügen</span>
          </button>
        )}
      </div>

      {/* Mood */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          😊 Stimmung
        </label>
        <div className="grid grid-cols-3 gap-2">
          {MOOD_OPTIONS.map((mood) => (
            <button
              key={mood.value}
              onClick={() => setSelectedMood(mood.value === selectedMood ? null : mood.value)}
              className={`px-4 py-3 rounded-lg text-center transition ${
                selectedMood === mood.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span className="text-xl">{mood.emoji}</span>
              <span className="block text-sm mt-1">{mood.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          🏷️ Tags
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="z.B. Reise, Familie, Natur (kommagetrennt)"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Track Recording */}
      {locationEnabled && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            📍 Track aufnehmen
          </label>
          <button
            onClick={handleToggleTracking}
            className={`w-full px-4 py-3 rounded-lg font-medium transition flex items-center justify-center ${
              location.isTracking
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {location.isTracking ? (
              <>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
                Track beenden ({location.trackPoints.length} Punkte)
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Track starten
              </>
            )}
          </button>
          
          {location.current && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              📍 {location.current.latitude.toFixed(5)}, {location.current.longitude.toFixed(5)}
              {location.current.accuracy && ` (±${location.current.accuracy.toFixed(0)}m)`}
            </p>
          )}
          
          {location.error && (
            <p className="mt-2 text-sm text-red-500">{location.error}</p>
          )}
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving || (!content.trim() && !title.trim())}
        className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-xl shadow-lg transition flex items-center justify-center"
      >
        {isSaving ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
            Speichern...
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Speichern
          </>
        )}
      </button>
    </div>
  )
}
