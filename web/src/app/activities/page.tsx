'use client'

/**
 * Activities page - Suggest activities at a destination with AI research
 */

import { useState } from 'react'
import { getAPIService } from '@/lib/api'
import type { ActivitySuggestionsResponse } from '@/lib/types'

const AVAILABLE_INTERESTS = [
  'Kultur',
  'Natur',
  'Sport',
  'Essen',
  'Geschichte',
  'Kunst',
  'Shopping',
  'Familie',
]

export default function ActivitiesPage() {
  const [useCurrentLocation, setUseCurrentLocation] = useState(true)
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<ActivitySuggestionsResponse | null>(null)

  const toggleInterest = (interest: string) => {
    const newInterests = new Set(selectedInterests)
    if (newInterests.has(interest)) {
      newInterests.delete(interest)
    } else {
      newInterests.add(interest)
    }
    setSelectedInterests(newInterests)
  }

  const loadSuggestions = async () => {
    setIsLoading(true)
    setError(null)

    try {
      let lat: number
      let lon: number

      if (useCurrentLocation) {
        // Get current location from browser
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject)
        })
        lat = position.coords.latitude
        lon = position.coords.longitude
      } else {
        const parsedLat = parseFloat(latitude)
        const parsedLon = parseFloat(longitude)
        if (isNaN(parsedLat) || isNaN(parsedLon)) {
          setError('Ungültige Koordinaten')
          setIsLoading(false)
          return
        }
        lat = parsedLat
        lon = parsedLon
      }

      const api = getAPIService()
      const interests = selectedInterests.size > 0 ? Array.from(selectedInterests) : undefined
      const result = await api.suggestActivities(lat, lon, interests)
      setSuggestions(result)
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden der Vorschläge')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Aktivitäten vorschlagen</h1>

        {/* Location input */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📍 Standort</h2>
          
          <label className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={useCurrentLocation}
              onChange={(e) => setUseCurrentLocation(e.target.checked)}
              className="mr-2"
            />
            <span>Aktuellen Standort nutzen</span>
          </label>

          {!useCurrentLocation && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Breitengrad
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="z.B. 48.1351"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Längengrad
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="z.B. 11.5820"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Interests selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">❤️ Interessen</h2>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_INTERESTS.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedInterests.has(interest)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        {/* Search button */}
        <button
          onClick={loadSuggestions}
          disabled={isLoading || (!useCurrentLocation && (!latitude || !longitude))}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed mb-6 flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Lade...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Aktivitäten vorschlagen
            </>
          )}
        </button>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Results */}
        {suggestions && <SuggestionsCard suggestions={suggestions} />}
      </div>
    </div>
  )
}

function SuggestionsCard({ suggestions }: { suggestions: ActivitySuggestionsResponse }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Location header */}
      <div className="flex items-center mb-6">
        <span className="text-4xl mr-3">📍</span>
        <h2 className="text-2xl font-bold text-gray-900">{suggestions.location}</h2>
      </div>

      {/* Activities */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Empfohlene Aktivitäten</h3>
        <div className="space-y-4">
          {suggestions.activities.map((activity, index) => (
            <ActivityCard key={index} activity={activity} number={index + 1} />
          ))}
        </div>
      </div>

      {/* Guided tour */}
      {suggestions.guided_tour && (
        <div>
          <hr className="my-6" />
          <GuidedTourCard tour={suggestions.guided_tour} />
        </div>
      )}
    </div>
  )
}

function ActivityCard({
  activity,
  number,
}: {
  activity: ActivitySuggestionsResponse['activities'][0]
  number: number
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-start mb-3">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
          {number}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-lg font-semibold text-gray-900">{activity.name}</h4>
            {activity.estimated_duration && (
              <span className="text-sm text-gray-600">⏱️ {activity.estimated_duration} min</span>
            )}
          </div>
          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded mb-2">
            {activity.category}
          </span>
        </div>
      </div>
      <p className="text-gray-700 mb-3">{activity.description}</p>
      <div className="flex items-start">
        <span className="text-yellow-500 mr-2">💡</span>
        <p className="text-sm text-gray-600">{activity.recommendation_reason}</p>
      </div>
    </div>
  )
}

function GuidedTourCard({ tour }: { tour: ActivitySuggestionsResponse['guided_tour'] }) {
  if (!tour) return null

  return (
    <div className="bg-green-50 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <span className="text-4xl mr-3">🚶</span>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">{tour.name}</h3>
            <span className="text-sm text-gray-600">⏱️ {tour.duration} min</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">Geführte Tour</p>
        </div>
      </div>

      <p className="text-gray-700 mb-4">{tour.description}</p>

      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 mb-2">Stopps ({tour.stops.length})</h4>
        <div className="space-y-2">
          {tour.stops
            .sort((a, b) => a.order - b.order)
            .map((stop) => (
              <div key={stop.order} className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 border-2 border-green-600 rounded-full flex items-center justify-center text-xs font-bold text-green-600 mr-3 mt-1">
                  {stop.order}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{stop.name}</div>
                  <p className="text-sm text-gray-600">{stop.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>

      <button
        onClick={() => {
          // Build Google Maps URL with all stops
          const stops = tour.stops
            .sort((a, b) => a.order - b.order)
            .map((stop) => `${stop.latitude},${stop.longitude}`)
            .join('/')
          const url = `https://www.google.com/maps/dir/${stops}`
          window.open(url, '_blank')
        }}
        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        Auf Karte anzeigen
      </button>
    </div>
  )
}
