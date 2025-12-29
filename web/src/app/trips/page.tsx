'use client'

import { useState } from 'react'

export default function TripsPage() {
  const [formData, setFormData] = useState({
    start: '',
    end: '',
    interests: '',
    hours: '',
    transport: 'driving'
  })

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
          
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Startort *
              </label>
              <input
                type="text"
                value={formData.start}
                onChange={(e) => setFormData({...formData, start: e.target.value})}
                placeholder="z.B. München"
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-3"
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
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Interessen
              </label>
              <input
                type="text"
                value={formData.interests}
                onChange={(e) => setFormData({...formData, interests: e.target.value})}
                placeholder="z.B. Natur, Geschichte, Essen"
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-3"
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
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transportmittel
                </label>
                <select
                  value={formData.transport}
                  onChange={(e) => setFormData({...formData, transport: e.target.value})}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-3"
                >
                  <option value="driving">Auto</option>
                  <option value="walking">Zu Fuß</option>
                  <option value="cycling">Fahrrad</option>
                  <option value="transit">ÖPNV</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              🤖 KI-Vorschlag generieren
            </button>
          </form>
        </div>

        {/* Map Placeholder */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
            Kartenansicht
          </h2>
          <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-4">🗺️</div>
              <p>Karte wird geladen...</p>
              <p className="text-sm mt-2">Route und POIs werden hier angezeigt</p>
            </div>
          </div>
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
