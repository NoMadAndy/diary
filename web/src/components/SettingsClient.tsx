'use client'

import { useSettings, useSync, useAuth, useApp } from '@/lib/context'
import { useState } from 'react'

export default function SettingsClient() {
  const { settings, updateSettings } = useSettings()
  const { pendingCount, isSyncing, lastSyncDate, sync, isOnline } = useSync()
  const { user, isAuthenticated, login, logout } = useAuth()
  const { api } = useApp()

  // Auth form state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [authSuccess, setAuthSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showApiUrl, setShowApiUrl] = useState(false)

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setFullName('')
    setAuthError(null)
    setAuthSuccess(null)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    setAuthSuccess(null)
    setIsSubmitting(true)

    try {
      console.log('Starting login for:', email)
      await login(email, password)
      console.log('Login successful')
      setAuthSuccess('Erfolgreich angemeldet!')
      resetForm()
    } catch (err) {
      console.error('Login error:', err)
      setAuthError(err instanceof Error ? err.message : 'Login fehlgeschlagen. Bitte prüfe deine Zugangsdaten und die Server-Verbindung.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    setAuthSuccess(null)

    // Validate passwords match
    if (password !== confirmPassword) {
      setAuthError('Passwörter stimmen nicht überein')
      return
    }

    // Validate password strength
    if (password.length < 8) {
      setAuthError('Passwort muss mindestens 8 Zeichen lang sein')
      return
    }

    setIsSubmitting(true)

    try {
      // Register the user
      await api.register(email, password, fullName || undefined)
      
      // Auto-login after successful registration
      await login(email, password)
      
      setAuthSuccess('Registrierung erfolgreich!')
      resetForm()
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Registrierung fehlgeschlagen')
    } finally {
      setIsSubmitting(false)
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
          <div className="space-y-4">
            {/* Login/Register Tabs */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setAuthError(null); setAuthSuccess(null); }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                  authMode === 'login'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Anmelden
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setAuthError(null); setAuthSuccess(null); }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                  authMode === 'register'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Registrieren
              </button>
            </div>

            {/* Success Message */}
            {authSuccess && (
              <div className="p-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg text-sm flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {authSuccess}
              </div>
            )}

            {/* Error Message */}
            {authError && (
              <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-sm">
                {authError}
              </div>
            )}

            {/* Login Form */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    E-Mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    autoComplete="current-password"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Wird angemeldet...
                    </>
                  ) : (
                    'Anmelden'
                  )}
                </button>
              </form>
            )}

            {/* Register Form */}
            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name (optional)
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Max Mustermann"
                    autoComplete="name"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    E-Mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Mindestens 8 Zeichen
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Passwort bestätigen
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className={`w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      confirmPassword && password !== confirmPassword
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">
                      Passwörter stimmen nicht überein
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || (confirmPassword !== '' && password !== confirmPassword)}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Wird registriert...
                    </>
                  ) : (
                    'Konto erstellen'
                  )}
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Mit der Registrierung akzeptierst du, dass deine Daten auf deinem eigenen Server gespeichert werden.
                </p>
              </form>
            )}
          </div>
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

      {/* Legacy Pages - kann später entfernt werden */}
      <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-6 border border-dashed border-gray-300 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-4">
          🗂️ Alte Seiten (Legacy)
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
          Diese Seiten werden bald entfernt oder in die neue Navigation integriert.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <a
            href="/entries"
            className="px-4 py-3 bg-white dark:bg-gray-800 rounded-lg text-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:shadow transition"
          >
            📝 Entries
          </a>
          <a
            href="/trips"
            className="px-4 py-3 bg-white dark:bg-gray-800 rounded-lg text-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:shadow transition"
          >
            ✈️ Trips
          </a>
          <a
            href="/sensors"
            className="px-4 py-3 bg-white dark:bg-gray-800 rounded-lg text-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:shadow transition"
          >
            📡 Sensors
          </a>
          <a
            href="/changelog"
            className="px-4 py-3 bg-white dark:bg-gray-800 rounded-lg text-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:shadow transition"
          >
            📋 Changelog
          </a>
        </div>
      </div>
    </div>
  )
}
