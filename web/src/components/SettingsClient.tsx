'use client'

import { useSettings, useSync, useAuth, useApp } from '@/lib/context'
import { useState } from 'react'

export default function SettingsClient() {
  const { settings, updateSettings } = useSettings()
  const { pendingCount, isSyncing, lastSyncDate, sync, isOnline } = useSync()
  const { user, isAuthenticated, login, logout } = useAuth()
  const { api } = useApp()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [showApiUrl, setShowApiUrl] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    setIsLoggingIn(true)

    try {
      await login(email, password)
      setEmail('')
      setPassword('')
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login fehlgeschlagen')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLogout = () => {
    if (confirm('Möchtest du dich wirklich abmelden?')) {
      logout()
    }
  }

  const handleSync = async () => {
    await sync()
  }

  const formatRelativeTime = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'gerade eben'
    if (minutes < 60) return `vor ${minutes} Minuten`
    if (hours < 24) return `vor ${hours} Stunden`
    return `vor ${days} Tagen`
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        ⚙️ Einstellungen
      </h1>

      {/* Auth Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          👤 Konto
        </h2>

        {isAuthenticated && user ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {user.full_name || user.email}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
              >
                Abmelden
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-sm">
                {loginError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                E-Mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
            >
              {isLoggingIn ? 'Wird angemeldet...' : 'Anmelden'}
            </button>
          </form>
        )}
      </div>

      {/* Connection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            🔗 Verbindung
          </h2>
          <button
            onClick={() => setShowApiUrl(!showApiUrl)}
            className="text-sm text-blue-600 hover:underline"
          >
            {showApiUrl ? 'Ausblenden' : 'Bearbeiten'}
          </button>
        </div>

        <div className="flex items-center mb-4">
          <div className={`w-3 h-3 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-gray-700 dark:text-gray-300">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {showApiUrl && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              API URL
            </label>
            <input
              type="url"
              value={settings.apiBaseUrl}
              onChange={(e) => updateSettings({ apiBaseUrl: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono text-sm"
            />
          </div>
        )}
      </div>

      {/* Privacy */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🔒 Datenschutz
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Aktiviere nur die Datenquellen, die du nutzen möchtest. Alle Daten bleiben auf deinen Geräten und deinem eigenen Server.
        </p>

        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Standortverfolgung</span>
            <input
              type="checkbox"
              checked={settings.enableLocationTracking}
              onChange={(e) => updateSettings({ enableLocationTracking: e.target.checked })}
              className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Fotozuordnung</span>
            <input
              type="checkbox"
              checked={settings.enablePhotoAssignment}
              onChange={(e) => updateSettings({ enablePhotoAssignment: e.target.checked })}
              className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Aktivitätserkennung</span>
            <input
              type="checkbox"
              checked={settings.enableActivityDetection}
              onChange={(e) => updateSettings({ enableActivityDetection: e.target.checked })}
              className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Wetter</span>
            <input
              type="checkbox"
              checked={settings.enableWeather}
              onChange={(e) => updateSettings({ enableWeather: e.target.checked })}
              className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* AI Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🤖 KI-Funktionen
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          KI-Funktionen nutzen OpenAI API. Wenn aktiviert, werden Textinhalte (ohne Fotos) an OpenAI gesendet.
        </p>

        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">KI-Funktionen aktivieren</span>
            <input
              type="checkbox"
              checked={settings.enableAI}
              onChange={(e) => updateSettings({ enableAI: e.target.checked })}
              className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
            />
          </label>

          {settings.enableAI && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reiseführer-Modus
              </label>
              <select
                value={settings.guideMode}
                onChange={(e) => updateSettings({ guideMode: e.target.value as any })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="off">Aus</option>
                <option value="compact">Kompakt</option>
                <option value="detailed">Detailliert</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Sync */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🔄 Synchronisation
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Ausstehende Uploads</span>
            <span className="text-gray-500 dark:text-gray-400">{pendingCount}</span>
          </div>

          {lastSyncDate && (
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Letzte Synchronisation</span>
              <span className="text-gray-500 dark:text-gray-400">
                {formatRelativeTime(lastSyncDate)}
              </span>
            </div>
          )}

          <button
            onClick={handleSync}
            disabled={isSyncing || !isOnline || !isAuthenticated}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition flex items-center justify-center"
          >
            {isSyncing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Synchronisiere...
              </>
            ) : (
              'Jetzt synchronisieren'
            )}
          </button>
        </div>
      </div>

      {/* Theme */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🎨 Darstellung
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Farbschema
          </label>
          <select
            value={settings.darkMode}
            onChange={(e) => updateSettings({ darkMode: e.target.value as any })}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="system">System</option>
            <option value="light">Hell</option>
            <option value="dark">Dunkel</option>
          </select>
        </div>
      </div>

      {/* About */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          ℹ️ Über
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Version</span>
            <span className="text-gray-500 dark:text-gray-400">0.1.0</span>
          </div>

          <a
            href="https://github.com/NoMadAndy/diary"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-blue-600 hover:underline"
          >
            <span>Quellcode</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}
