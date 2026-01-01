'use client'

import { useEffect, useState, useRef } from 'react'
import { useApp, useLocation, useTracks } from '@/lib/context'
import type { GuidePOIResponse } from '@/lib/types'

// Dynamic import for Leaflet to avoid SSR issues
let L: typeof import('leaflet') | null = null

export default function MapClient() {
  const { isAuthenticated, api, settings } = useApp()
  const { location, startTracking, stopTracking } = useLocation()
  const { tracks, loadTracks } = useTracks()

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const userMarkerRef = useRef<L.Marker | null>(null)
  const trackLayerRef = useRef<L.LayerGroup | null>(null)

  const [isMapReady, setIsMapReady] = useState(false)
  const [guideText, setGuideText] = useState<string | null>(null)
  const [isLoadingGuide, setIsLoadingGuide] = useState(false)

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return

    const initMap = async () => {
      // Dynamic import Leaflet
      const leaflet = await import('leaflet')
      await import('leaflet/dist/leaflet.css')
      L = leaflet

      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      // Create map
      const map = L.map(mapContainerRef.current!, {
        center: [48.1351, 11.5820], // Munich as default
        zoom: 12,
        zoomControl: true,
      })

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      // Create layer for tracks
      trackLayerRef.current = L.layerGroup().addTo(map)

      mapRef.current = map
      setIsMapReady(true)

      // Try to get user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            map.setView([latitude, longitude], 14)

            // Add user marker
            const userIcon = L.divIcon({
              className: 'user-location-marker',
              html: '<div class="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg"></div>',
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })

            userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon })
              .addTo(map)
              .bindPopup('Dein Standort')
          },
          (error) => {
            console.error('Geolocation error:', error)
          }
        )
      }
    }

    initMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Update user location on map
  useEffect(() => {
    if (!mapRef.current || !L || !location.current) return

    const { latitude, longitude } = location.current

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([latitude, longitude])
    } else {
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: '<div class="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg pulse-animation"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })

      userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon })
        .addTo(mapRef.current)
        .bindPopup('Dein Standort')
    }
  }, [location.current])

  // Draw tracks
  useEffect(() => {
    if (!mapRef.current || !L || !trackLayerRef.current) return

    // Clear existing tracks
    trackLayerRef.current.clearLayers()

    // Draw each track
    tracks.forEach((track, index) => {
      if (track.track_data.length < 2) return

      const latlngs = track.track_data.map((point) => [point.lat, point.lng] as [number, number])
      const color = `hsl(${(index * 60) % 360}, 70%, 50%)`

      const polyline = L.polyline(latlngs, {
        color,
        weight: 4,
        opacity: 0.8,
      })

      polyline.bindPopup(`
        <div class="p-2">
          <strong>${track.name || 'Track'}</strong>
          ${track.distance_meters ? `<br>${(track.distance_meters / 1000).toFixed(2)} km` : ''}
          ${track.duration_seconds ? `<br>${Math.round(track.duration_seconds / 60)} min` : ''}
        </div>
      `)

      trackLayerRef.current?.addLayer(polyline)

      // Add start/end markers
      if (latlngs.length > 0) {
        const startMarker = L.circleMarker(latlngs[0], {
          radius: 6,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 1,
        })
        trackLayerRef.current?.addLayer(startMarker)

        if (latlngs.length > 1) {
          const endMarker = L.circleMarker(latlngs[latlngs.length - 1], {
            radius: 6,
            fillColor: '#ef4444',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 1,
          })
          trackLayerRef.current?.addLayer(endMarker)
        }
      }
    })
  }, [tracks])

  // Load tracks when authenticated
  useEffect(() => {
    if (isAuthenticated && isMapReady) {
      loadTracks()
    }
  }, [isAuthenticated, isMapReady, loadTracks])

  // Center on user
  const centerOnUser = () => {
    if (!mapRef.current || !location.current) return
    mapRef.current.setView([location.current.latitude, location.current.longitude], 15)
  }

  // Fetch guide info
  const fetchGuideInfo = async () => {
    if (!location.current || settings.guideMode === 'off') return

    setIsLoadingGuide(true)
    try {
      const response = await api.getGuidePOI(
        location.current.latitude,
        location.current.longitude,
        settings.guideMode
      )
      setGuideText(response.text)
    } catch (error) {
      setGuideText('Konnte keine POI-Informationen laden.')
    } finally {
      setIsLoadingGuide(false)
    }
  }

  return (
    <div className="relative h-[calc(100vh-200px)] min-h-[500px] rounded-xl overflow-hidden">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
        {/* Center on user */}
        <button
          onClick={centerOnUser}
          disabled={!location.current}
          className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          title="Auf meinen Standort zentrieren"
        >
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Track toggle */}
        <button
          onClick={() => location.isTracking ? stopTracking() : startTracking()}
          className={`p-3 rounded-lg shadow-lg ${
            location.isTracking
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title={location.isTracking ? 'Track beenden' : 'Track starten'}
        >
          {location.isTracking ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Guide Button */}
      {settings.enableAI && settings.guideMode !== 'off' && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000]">
          {guideText ? (
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur rounded-xl shadow-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                  🗺️ Reiseführer
                </h3>
                <button
                  onClick={() => setGuideText(null)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm">{guideText}</p>
            </div>
          ) : (
            <button
              onClick={fetchGuideInfo}
              disabled={isLoadingGuide || !location.current}
              className="w-full px-4 py-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur rounded-xl shadow-lg hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center"
            >
              {isLoadingGuide ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium text-gray-900 dark:text-white">Reiseführer</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Track info */}
      {location.isTracking && (
        <div className="absolute top-4 left-4 z-[1000] bg-white/95 dark:bg-gray-800/95 backdrop-blur rounded-lg shadow-lg px-4 py-2">
          <div className="flex items-center text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
            <span className="font-medium">Track läuft</span>
            <span className="ml-2 text-gray-500 dark:text-gray-400">
              ({location.trackPoints.length} Punkte)
            </span>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {!isMapReady && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Karte wird geladen...</p>
          </div>
        </div>
      )}

      {/* Leaflet CSS fix for dark mode and custom markers */}
      <style jsx global>{`
        .leaflet-container {
          font-family: inherit;
        }
        .user-location-marker {
          background: transparent;
          border: none;
        }
        .pulse-animation {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
      `}</style>
    </div>
  )
}
