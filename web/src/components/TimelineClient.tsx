'use client'

import { useEffect, useState } from 'react'
import { useEntries, useSync, useApp } from '@/lib/context'
import { getMoodEmoji } from '@/lib/types'
import type { Entry } from '@/lib/types'

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function EntryCard({ entry }: { entry: Entry }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          {entry.title ? (
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
              {entry.title}
            </h3>
          ) : (
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
              {formatDate(entry.entry_date)}
            </h3>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatTime(entry.entry_date)}
          </p>
        </div>
        {entry.mood && (
          <span className="text-2xl" title={entry.mood}>
            {getMoodEmoji(entry.mood)}
          </span>
        )}
      </div>

      {entry.content && (
        <p className="text-gray-700 dark:text-gray-300 mb-3 line-clamp-3">
          {entry.content}
        </p>
      )}

      {entry.location_name && (
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {entry.location_name}
        </div>
      )}

      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {entry.ai_summary && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 italic">
            🤖 {entry.ai_summary}
          </p>
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">📝</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Noch keine Einträge
      </h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
        Tippe auf &quot;Aufnehmen&quot; um deinen ersten Moment festzuhalten.
      </p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600 dark:text-gray-400">Lade Einträge...</span>
    </div>
  )
}

export default function TimelineClient() {
  const { entries, loadEntries } = useEntries()
  const { sync, isSyncing, isOnline } = useSync()
  const { isAuthenticated, isLoading: authLoading } = useApp()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated) {
        setIsLoading(false)
        return
      }
      
      try {
        setError(null)
        await loadEntries()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden')
      } finally {
        setIsLoading(false)
      }
    }
    
    if (!authLoading) {
      load()
    }
  }, [isAuthenticated, authLoading, loadEntries])

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      await sync()
      await loadEntries()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Aktualisieren')
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return <LoadingState />
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔐</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Bitte anmelden
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Melde dich an um deine Einträge zu sehen.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          📅 Timeline
        </h1>
        <button
          onClick={handleRefresh}
          disabled={isLoading || isSyncing}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition"
        >
          {(isLoading || isSyncing) ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          ) : (
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Aktualisieren
        </button>
      </div>

      {/* Online Status */}
      {!isOnline && (
        <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-lg flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
          Offline - Änderungen werden gespeichert und später synchronisiert
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={handleRefresh} className="text-sm underline">
            Erneut versuchen
          </button>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <LoadingState />
      ) : entries.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
