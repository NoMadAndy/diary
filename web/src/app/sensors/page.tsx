import SensorsClient from './sensors-client'

export const metadata = {
  title: 'SmartDiary - Sensoren',
  description: 'Gerätefunktionen und Sensoren nutzen (nur wenn verfügbar).',
}

export default function SensorsPage() {
  return <SensorsClient />
}
