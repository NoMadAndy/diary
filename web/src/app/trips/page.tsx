'use client'

import { useState } from 'react'

interface POI {
  name: string
  description: string
  latitude: number
  longitude: number
  category: string
  estimated_duration_minutes?: number
  rating?: number
}

interface TripSuggestion {
  route_description: string
  total_distance_km?: number
  total_duration_hours?: number
  pois: POI[]
  reasoning: string
}

export default function TripsPage() {
  const [formData, setFormData] = useState({
    start: '',
    end: '',
    interests: '',
    hours: '',
    transport: 'driving'
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState<TripSuggestion | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.start.trim()) {
      setError('Bitte gib einen Startort ein.')
      return
    }

    setLoading(true)
    setError(null)
    setSuggestion(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      
      const payload = {
        start_location: formData.start.trim(),
        end_location: formData.end.trim() || null,
        interests: formData.interests
          ? formData.interests.split(',').map(i => i.trim()).filter(Boolean)
          : [],
        time_budget_hours: formData.hours ? parseFloat(formData.hours) : null,
        transport_mode: formData.transport,
      }

      const res = await fetch(`${apiUrl}/api/v1/ai/trips/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || `Fehler ${res.status}: ${res.statusText}`)
      }

      const data: TripSuggestion = await res.json()
      setSuggestion(data)
    } catch (err: any) {
      console.error('Trip suggestion error:', err)
      setError(err.message || 'Fehler bei der Anfrage. Ist das Backend erreichbar?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        🗺️ Trip Planen
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trip Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
            Neuen Trip planen
          </h2>
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Startort *
              </label>
              <input
                type="text"
                value={formData.start}
                onChange={(e) => setFormData({...formData, start: e.target.value})}
                placeholder="z.B. München"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Zielort (optional für Rundtour)
              </label>
              <input
                type="text"
                value={formData.end}
                onChange={(e) => setFormData({...formData, end: e.target.value})}
                placeholder="z.B. Salzburg"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Interessen (kommagetrennt)
              </label>
              <input
                type="text"
                value={formData.interests}
                onChange={(e) => setFormData({...formData, interests: e.target.value})}
                placeholder="z.B. Natur, Geschichte, Essen"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Zeitbudget (Stunden)
                </label>
                <input
                  type="number"
                  value={formData.hours}
                  onChange={(e) => setFormData({...formData, hours: e.target.value})}
                  placeholder="z.B. 4"
                  min="0.5"
                  step="0.5"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transportmittel
                </label>
                <select
                  value={formData.transport}
                  onChange={(e) => setFormData({...formData, transport: e.target.value})}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                >
                  <option value="driving">Auto</option>
                  <option value="walking">Zu Fuß</option>
                  <option value="cycling">Fahrrad</option>
                  <option value="transit">ÖPNV</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generiere Vorschlag...
                </>
              ) : (
                <>🤖 KI-Vorschlag generieren</>
              )}
            </button>
          </form>
        </div>

        {/* Result / Map Area */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
            {suggestion ? '🗺️ Routenvorschlag' : 'Kartenansicht'}
          </h2>

          {!suggestion && !loading && (
            <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-4">🗺️</div>
                <p>Fülle das Formular aus und</p>
                <p className="text-sm mt-1">generiere einen KI-Vorschlag!</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-blue-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p>KI generiert Route...</p>
                <p className="text-sm mt-1">Das kann einen Moment dauern</p>
              </div>
            </div>
          )}

          {suggestion && (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {/* Route Description */}
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Route</h3>
                <p className="text-blue-800 dark:text-blue-300 text-sm">{suggestion.route_description}</p>
                
                {(suggestion.total_distance_km || suggestion.total_duration_hours) && (
                  <div className="flex gap-4 mt-3 text-sm">
                    {suggestion.total_distance_km && (
                      <span className="text-blue-700 dark:text-blue-400">
                        📏 {suggestion.total_distance_km.toFixed(1)} km
                      </span>
                    )}
                    {suggestion.total_duration_hours && (
                      <span className="text-blue-700 dark:text-blue-400">
                        ⏱️ {suggestion.total_duration_hours.toFixed(1)} Std.
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* POIs */}
              {suggestion.pois.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">📍 Sehenswürdigkeiten</h3>
                  <div className="space-y-3">
                    {suggestion.pois.map((poi, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border-l-4 border-purple-500"
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-gray-900 dark:text-white">{poi.name}</h4>
                          <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                            {poi.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{poi.description}</p>
                        <div className="flex gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {poi.estimated_duration_minutes && (
                            <span>⏱️ ca. {poi.estimated_duration_minutes} Min.</span>
                          )}
                          {poi.rating && <span>⭐ {poi.rating.toFixed(1)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reasoning */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">💡 Begründung</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{suggestion.reasoning}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Saved Trips */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          📋 Gespeicherte Trips
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-4">🗂️</div>
          <p>Noch keine Trips gespeichert.</p>
          <p className="text-sm mt-2">Generiere einen Trip-Vorschlag und speichere ihn!</p>
        </div>
      </div>
    </div>
  )
}
