export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-12 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Willkommen bei SmartDiary
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Dein KI-gestützter Lebensbegleiter für Tagebuch, Reisen und persönliche Erinnerungen.
        </p>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="text-3xl mb-2">📝</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
          <div className="text-gray-500 dark:text-gray-400">Einträge heute</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="text-3xl mb-2">🗺️</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">0 km</div>
          <div className="text-gray-500 dark:text-gray-400">Diese Woche</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="text-3xl mb-2">📸</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
          <div className="text-gray-500 dark:text-gray-400">Fotos</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="text-3xl mb-2">🏷️</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
          <div className="text-gray-500 dark:text-gray-400">Tags</div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            📅 Letzte Einträge
          </h2>
          <div className="text-gray-500 dark:text-gray-400 text-center py-8">
            Noch keine Einträge vorhanden.
            <br />
            <span className="text-sm">Erstelle deinen ersten Eintrag in der iOS App!</span>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            🤖 KI-Zusammenfassung
          </h2>
          <div className="text-gray-500 dark:text-gray-400 text-center py-8">
            Keine Zusammenfassung verfügbar.
            <br />
            <span className="text-sm">Einträge werden automatisch zusammengefasst.</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          ✨ Funktionen
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl mb-4">📍</div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Auto-Logging</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Automatische Erfassung von Orten, Tracks und Fotos
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">KI-Analyse</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Intelligente Zusammenfassungen und Tag-Vorschläge
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Reiseführer</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              KI-gestützter Reisebegleiter mit POI-Informationen
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
