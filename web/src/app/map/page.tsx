import MapClient from '@/components/MapClient'

export const metadata = {
  title: 'Karte - SmartDiary',
}

export default function MapPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        🗺️ Karte
      </h1>
      <MapClient />
    </div>
  )
}
