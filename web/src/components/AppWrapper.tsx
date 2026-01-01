'use client'

import { ReactNode, useEffect, useState } from 'react'
import { AppProvider } from '@/lib/context'
import BottomNav from './BottomNav'

export default function AppWrapper({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        {/* Header - only on larger screens */}
        <header className="hidden md:block bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <a href="/" className="text-2xl font-bold flex items-center">
                📔 SmartDiary
              </a>
              <nav className="space-x-6">
                <a href="/" className="hover:text-blue-200 transition">Timeline</a>
                <a href="/record" className="hover:text-blue-200 transition">Aufnehmen</a>
                <a href="/map" className="hover:text-blue-200 transition">Karte</a>
                <a href="/changelog" className="hover:text-blue-200 transition">Was ist neu?</a>
                <a href="/settings" className="hover:text-blue-200 transition">Einstellungen</a>
              </nav>
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
          <div className="px-4 py-3 flex items-center justify-center">
            <span className="text-xl font-bold">📔 SmartDiary</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>

        {/* Bottom Navigation - mobile */}
        <BottomNav />
      </div>
    </AppProvider>
  )
}
