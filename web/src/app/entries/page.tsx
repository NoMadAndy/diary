export default function EntriesPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        📝 Einträge
      </h1>
      
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Zeitraum
            </label>
            <select className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700">
              <option>Heute</option>
              <option>Diese Woche</option>
              <option>Dieser Monat</option>
              <option>Alle</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <input
              type="text"
              placeholder="z.B. Reise, Familie"
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ort
            </label>
            <input
              type="text"
              placeholder="z.B. München"
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            />
          </div>
          <div className="flex items-end">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition">
              Suchen
            </button>
          </div>
        </div>
      </div>

      {/* Entry List */}
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-4">📭</div>
          <p>Noch keine Einträge vorhanden.</p>
          <p className="text-sm mt-2">
            Erstelle deinen ersten Eintrag in der iOS App oder warte auf automatische Einträge.
          </p>
        </div>
      </div>
    </div>
  )
}
