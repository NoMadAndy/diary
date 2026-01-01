import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import PwaRegister from './pwa-register'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SmartDiary - Dashboard',
  description: 'KI-gestütztes Tagebuch-, Reise- und Lebenslog-System',
  manifest: '/manifest.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <PwaRegister />
        <div className="min-h-screen flex flex-col">
          <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
            <div className="container mx-auto px-4 py-4">
              <nav className="flex items-center justify-between">
                <a href="/" className="text-2xl font-bold">📔 SmartDiary</a>
                <div className="space-x-6">
                  <a href="/" className="hover:text-blue-200 transition">Dashboard</a>
                  <a href="/entries" className="hover:text-blue-200 transition">Einträge</a>
                  <a href="/trips" className="hover:text-blue-200 transition">Trips</a>
                  <a href="/sensors" className="hover:text-blue-200 transition">Sensoren</a>
                  <a href="/changelog" className="hover:text-blue-200 transition">Was ist neu?</a>
                </div>
              </nav>
            </div>
          </header>
          <main className="flex-1 container mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="bg-gray-100 dark:bg-gray-900 py-4">
            <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
              SmartDiary © {new Date().getFullYear()} - Dein persönlicher Lebensbegleiter
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
