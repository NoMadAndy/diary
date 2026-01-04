'use client'

/**
 * Summaries page - Display daily and multi-day summaries with tracks and photos
 */

import { useState, useEffect } from 'react'
import { getAPIService } from '@/lib/api'
import type { AISummaryResponse, MultiDaySummaryResponse } from '@/lib/types'

type Period = 'today' | 'week' | 'month'

export default function SummariesPage() {
  const [period, setPeriod] = useState<Period>('today')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [daySummary, setDaySummary] = useState<AISummaryResponse | null>(null)
  const [multiDaySummary, setMultiDaySummary] = useState<MultiDaySummaryResponse | null>(null)

  useEffect(() => {
    loadSummary()
  }, [period])

  const loadSummary = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const api = getAPIService()

      if (period === 'today') {
        const today = new Date().toISOString().split('T')[0]
        const summary = await api.getDailySummary(today)
        setDaySummary(summary)
        setMultiDaySummary(null)
      } else {
        const endDate = new Date()
        const startDate = new Date()
        
        if (period === 'week') {
          startDate.setDate(endDate.getDate() - 7)
        } else if (period === 'month') {
          startDate.setDate(endDate.getDate() - 30)
        }

        const summary = await api.getMultiDaySummary(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        )
        setMultiDaySummary(summary)
        setDaySummary(null)
      }
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden der Zusammenfassung')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Zusammenfassungen</h1>

        {/* Period selector */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setPeriod('today')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Heute
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Letzte Woche
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Letzter Monat
          </button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Lade Zusammenfassung...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
            <button
              onClick={loadSummary}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Erneut versuchen
            </button>
          </div>
        )}

        {/* Day summary */}
        {daySummary && <DaySummaryCard summary={daySummary} />}

        {/* Multi-day summary */}
        {multiDaySummary && <MultiDaySummaryCard summary={multiDaySummary} />}
      </div>
    </div>
  )
}

function DaySummaryCard({ summary }: { summary: AISummaryResponse }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{summary.date}</h2>
        {summary.suggested_title && (
          <p className="text-lg text-gray-600 mt-1">{summary.suggested_title}</p>
        )}
      </div>

      {/* Summary text */}
      <p className="text-gray-700 mb-6">{summary.summary}</p>

      {/* Highlights */}
      {summary.highlights.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Highlights</h3>
          <ul className="space-y-2">
            {summary.highlights.map((highlight, index) => (
              <li key={index} className="flex items-start">
                <span className="text-yellow-500 mr-2">⭐</span>
                <span className="text-gray-700">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(summary.statistics).map(([key, value]) => (
          <div key={key} className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{value}</div>
            <div className="text-sm text-gray-600 mt-1 capitalize">{key}</div>
          </div>
        ))}
      </div>

      {/* Suggested tags */}
      {summary.suggested_tags && summary.suggested_tags.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Vorgeschlagene Tags</h3>
          <div className="flex flex-wrap gap-2">
            {summary.suggested_tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MultiDaySummaryCard({ summary }: { summary: MultiDaySummaryResponse }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          {summary.start_date} - {summary.end_date}
        </h2>
        <p className="text-gray-600 mt-1">{summary.total_statistics.days_count} Tage</p>
      </div>

      {/* Overall summary */}
      <p className="text-gray-700 mb-6">{summary.summary}</p>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon="📝"
          label="Einträge"
          value={summary.total_statistics.total_entries}
        />
        {summary.total_statistics.total_distance && (
          <StatCard
            icon="🚶"
            label="Strecke"
            value={`${(summary.total_statistics.total_distance / 1000).toFixed(1)} km`}
          />
        )}
        {summary.total_statistics.total_elevation_gain && (
          <StatCard
            icon="⛰️"
            label="Höhenmeter"
            value={`${summary.total_statistics.total_elevation_gain.toFixed(0)} m`}
          />
        )}
        {summary.total_statistics.total_duration && (
          <StatCard
            icon="⏱️"
            label="Dauer"
            value={`${Math.floor(summary.total_statistics.total_duration / 3600)} h`}
          />
        )}
      </div>

      {/* Highlights */}
      {summary.highlights.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Highlights</h3>
          <ul className="space-y-2">
            {summary.highlights.map((highlight, index) => (
              <li key={index} className="flex items-start">
                <span className="text-yellow-500 mr-2">⭐</span>
                <span className="text-gray-700">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tracks */}
      {summary.tracks && summary.tracks.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Aufgezeichnete Tracks</h3>
          <div className="space-y-2">
            {summary.tracks.map((track) => (
              <div key={track.id} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                <div>
                  <div className="font-medium">{track.name || `Track ${track.id}`}</div>
                  <div className="text-sm text-gray-600">{track.date}</div>
                </div>
                <div className="text-right text-sm text-gray-600">
                  {track.distance_meters && `${(track.distance_meters / 1000).toFixed(1)} km`}
                  {track.elevation_gain && ` • ${track.elevation_gain.toFixed(0)} m ↑`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily summaries */}
      {summary.daily_summaries.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Tägliche Zusammenfassungen</h3>
          <div className="space-y-4">
            {summary.daily_summaries.map((daySummary, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <div className="font-medium text-gray-900">{daySummary.date}</div>
                <p className="text-gray-700 text-sm mt-1">{daySummary.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
  )
}
