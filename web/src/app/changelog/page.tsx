'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { getDefaultApiUrl } from '@/lib/types'

interface ChangelogVersion {
  version: string
  date: string | null
  added: string[]
  changed: string[]
  fixed: string[]
  security: string[]
}

interface ChangelogData {
  markdown: string
  versions: ChangelogVersion[]
}

export default function ChangelogPage() {
  const [changelog, setChangelog] = useState<ChangelogData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'structured' | 'markdown'>('structured')

  useEffect(() => {
    const fetchChangelog = async () => {
      try {
        const apiUrl = getDefaultApiUrl()
        const response = await fetch(`${apiUrl}/api/v1/meta/changelog`)
        if (!response.ok) {
          throw new Error('Failed to fetch changelog')
        }
        const data = await response.json()
        setChangelog(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchChangelog()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
        <p className="font-semibold">Fehler beim Laden des Changelogs</p>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          🆕 Was ist neu?
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('structured')}
            className={`px-4 py-2 rounded-lg transition ${
              viewMode === 'structured'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Strukturiert
          </button>
          <button
            onClick={() => setViewMode('markdown')}
            className={`px-4 py-2 rounded-lg transition ${
              viewMode === 'markdown'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Markdown
          </button>
        </div>
      </div>

      {viewMode === 'structured' && changelog?.versions && (
        <div className="space-y-6">
          {changelog.versions.map((version, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold">Version {version.version}</span>
                  {version.date && (
                    <span className="text-blue-100">{version.date}</span>
                  )}
                </div>
              </div>
              <div className="p-6 space-y-4">
                {version.added.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-green-600 dark:text-green-400 mb-2">
                      ➕ Hinzugefügt
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                      {version.added.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {version.changed.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">
                      🔄 Geändert
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                      {version.changed.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {version.fixed.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-orange-600 dark:text-orange-400 mb-2">
                      🐛 Behoben
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                      {version.fixed.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {version.security.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-red-600 dark:text-red-400 mb-2">
                      🔒 Sicherheit
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                      {version.security.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'markdown' && changelog?.markdown && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <div className="markdown prose dark:prose-invert max-w-none">
            <ReactMarkdown>{changelog.markdown}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}
