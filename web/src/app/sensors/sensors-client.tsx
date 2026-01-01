'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type PermissionStateLike = 'granted' | 'denied' | 'prompt' | 'unknown'

function normalizeNotificationPermission(value: any): PermissionStateLike {
  if (value === 'granted' || value === 'denied') return value
  // NotificationPermission includes 'default' -> treat as prompt-like.
  if (value === 'default') return 'prompt'
  return 'unknown'
}

type GeoState =
  | { status: 'idle' }
  | { status: 'watching'; coords: GeolocationCoordinates; timestamp: number }
  | { status: 'error'; message: string }

type BatteryState =
  | { status: 'unsupported' }
  | { status: 'loading' }
  | { status: 'ready'; level: number; charging: boolean }

function isSecureContextHint(): boolean {
  if (typeof window === 'undefined') return true
  // iOS Safari requires HTTPS for most sensor permissions.
  return window.isSecureContext
}

async function queryPermission(name: PermissionName): Promise<PermissionStateLike> {
  try {
    if (!navigator.permissions?.query) return 'unknown'
    const res = await navigator.permissions.query({ name })
    return res.state
  } catch {
    return 'unknown'
  }
}

function boolLabel(value: boolean) {
  return value ? 'Ja' : 'Nein'
}

function formatNumber(value: number, digits = 6) {
  return Number.isFinite(value) ? value.toFixed(digits) : String(value)
}

export default function SensorsClient() {
  // Start with null to avoid hydration mismatch - computed only on client
  const [supports, setSupports] = useState<{
    geolocation: boolean
    orientation: boolean
    motion: boolean
    camera: boolean
    microphone: boolean
    notifications: boolean
    share: boolean
    clipboard: boolean
    vibration: boolean
    wakeLock: boolean
    battery: boolean
    connection: boolean
    storage: boolean
  } | null>(null)

  const [secureContext, setSecureContext] = useState(true)

  const [geoPermission, setGeoPermission] = useState<PermissionStateLike>('unknown')
  const [geoState, setGeoState] = useState<GeoState>({ status: 'idle' })
  const geoWatchId = useRef<number | null>(null)

  const [motionPermission, setMotionPermission] = useState<PermissionStateLike>('unknown')
  const [orientationPermission, setOrientationPermission] = useState<PermissionStateLike>('unknown')
  const [motionData, setMotionData] = useState<{ ax?: number; ay?: number; az?: number } | null>(null)
  const [orientationData, setOrientationData] = useState<{ alpha?: number; beta?: number; gamma?: number } | null>(null)

  const [cameraPermission, setCameraPermission] = useState<PermissionStateLike>('unknown')
  const [micPermission, setMicPermission] = useState<PermissionStateLike>('unknown')
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [mediaActive, setMediaActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [notifPermission, setNotifPermission] = useState<PermissionStateLike>('unknown')
  const [batteryState, setBatteryState] = useState<BatteryState>({ status: 'unsupported' })
  const [online, setOnline] = useState(true)

  const [wakeLockActive, setWakeLockActive] = useState(false)
  const wakeLockRef = useRef<any>(null)

  const [storageEstimate, setStorageEstimate] = useState<{ usage?: number; quota?: number } | null>(null)
  const [connectionInfo, setConnectionInfo] = useState<{ effectiveType?: string; downlink?: number; rtt?: number } | null>(null)

  useEffect(() => {
    setSecureContext(isSecureContextHint())
    setOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)

    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    // Compute supports on client only to avoid hydration mismatch
    const hasMedia = !!navigator.mediaDevices?.getUserMedia
    const hasClipboard = !!navigator.clipboard
    setSupports({
      geolocation: 'geolocation' in navigator,
      orientation: 'DeviceOrientationEvent' in window,
      motion: 'DeviceMotionEvent' in window,
      camera: hasMedia,
      microphone: hasMedia,
      notifications: 'Notification' in window,
      share: typeof navigator.share === 'function',
      clipboard: hasClipboard,
      vibration: typeof navigator.vibrate === 'function',
      wakeLock: 'wakeLock' in navigator,
      battery: 'getBattery' in navigator,
      connection: 'connection' in navigator,
      storage: !!navigator.storage?.estimate,
    })

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    if (!supports?.geolocation) return
    queryPermission('geolocation').then(setGeoPermission)
  }, [supports?.geolocation])

  useEffect(() => {
    if (!supports?.notifications) return
    try {
      setNotifPermission(normalizeNotificationPermission((Notification as any).permission))
    } catch {
      setNotifPermission('unknown')
    }
  }, [supports?.notifications])

  useEffect(() => {
    if (!supports?.camera) return
    queryPermission('camera' as PermissionName).then(setCameraPermission)
  }, [supports?.camera])

  useEffect(() => {
    if (!supports?.microphone) return
    queryPermission('microphone' as PermissionName).then(setMicPermission)
  }, [supports?.microphone])

  useEffect(() => {
    if (!supports?.connection) return
    const anyNav = navigator as any
    const update = () => {
      const c = anyNav.connection
      if (!c) return
      setConnectionInfo({
        effectiveType: c.effectiveType,
        downlink: c.downlink,
        rtt: c.rtt,
      })
    }

    update()
    anyNav.connection?.addEventListener?.('change', update)
    return () => anyNav.connection?.removeEventListener?.('change', update)
  }, [supports?.connection])

  useEffect(() => {
    if (!supports?.storage) return
    const run = async () => {
      try {
        const est = await navigator.storage.estimate()
        setStorageEstimate({ usage: est.usage ?? undefined, quota: est.quota ?? undefined })
      } catch {
        setStorageEstimate(null)
      }
    }
    run()
  }, [supports?.storage])

  useEffect(() => {
    if (!supports?.battery) return
    let battery: any
    let cancelled = false

    const run = async () => {
      try {
        setBatteryState({ status: 'loading' })
        const anyNav = navigator as any
        battery = await anyNav.getBattery()
        if (cancelled) return

        const update = () => {
          setBatteryState({
            status: 'ready',
            level: battery.level,
            charging: battery.charging,
          })
        }

        update()
        battery.addEventListener?.('levelchange', update)
        battery.addEventListener?.('chargingchange', update)
      } catch {
        setBatteryState({ status: 'unsupported' })
      }
    }

    run()

    return () => {
      cancelled = true
      if (battery?.removeEventListener) {
        // Best-effort cleanup
        battery.removeEventListener('levelchange', () => {})
        battery.removeEventListener('chargingchange', () => {})
      }
    }
  }, [supports?.battery])

  const stopGeo = () => {
    if (geoWatchId.current != null && supports?.geolocation) {
      navigator.geolocation.clearWatch(geoWatchId.current)
      geoWatchId.current = null
    }
    setGeoState({ status: 'idle' })
  }

  const startGeo = () => {
    if (!supports?.geolocation) return

    setGeoState({ status: 'idle' })
    setGeoPermission('unknown')

    geoWatchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGeoState({ status: 'watching', coords: pos.coords, timestamp: pos.timestamp })
      },
      (err) => {
        setGeoState({ status: 'error', message: err.message })
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 15000,
      }
    )

    queryPermission('geolocation').then(setGeoPermission)
  }

  const requestMotion = async () => {
    if (!supports?.motion) return
    try {
      const anyDME = DeviceMotionEvent as any
      if (typeof anyDME.requestPermission === 'function') {
        const res = await anyDME.requestPermission()
        setMotionPermission(res)
        return
      }
      setMotionPermission('granted')
    } catch {
      setMotionPermission('denied')
    }
  }

  const requestOrientation = async () => {
    if (!supports?.orientation) return
    try {
      const anyDOE = DeviceOrientationEvent as any
      if (typeof anyDOE.requestPermission === 'function') {
        const res = await anyDOE.requestPermission()
        setOrientationPermission(res)
        return
      }
      setOrientationPermission('granted')
    } catch {
      setOrientationPermission('denied')
    }
  }

  useEffect(() => {
    if (!supports?.motion) return
    if (motionPermission !== 'granted') return

    const handler = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity || e.acceleration
      if (!acc) return
      setMotionData({ ax: acc.x ?? undefined, ay: acc.y ?? undefined, az: acc.z ?? undefined })
    }

    window.addEventListener('devicemotion', handler)
    return () => window.removeEventListener('devicemotion', handler)
  }, [supports?.motion, motionPermission])

  useEffect(() => {
    if (!supports?.orientation) return
    if (orientationPermission !== 'granted') return

    const handler = (e: DeviceOrientationEvent) => {
      setOrientationData({
        alpha: e.alpha ?? undefined,
        beta: e.beta ?? undefined,
        gamma: e.gamma ?? undefined,
      })
    }

    window.addEventListener('deviceorientation', handler)
    return () => window.removeEventListener('deviceorientation', handler)
  }, [supports?.orientation, orientationPermission])

  const stopMedia = () => {
    setMediaActive(false)
    setMediaError(null)

    const stream = streamRef.current
    if (stream) {
      for (const track of stream.getTracks()) track.stop()
    }

    streamRef.current = null
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null
      } catch {
        // ignore
      }
    }
  }

  const startCameraAndMic = async () => {
    if (!supports?.camera && !supports?.microphone) return
    if (!secureContext) {
      setMediaError('HTTPS erforderlich (Secure Context).')
      return
    }

    setMediaError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: supports?.camera,
        audio: supports?.microphone,
      })

      streamRef.current = stream
      setMediaActive(true)

      if (videoRef.current && supports?.camera) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }

      queryPermission('camera' as PermissionName).then(setCameraPermission)
      queryPermission('microphone' as PermissionName).then(setMicPermission)
    } catch (e: any) {
      setMediaActive(false)
      setMediaError(e?.message ?? 'Zugriff fehlgeschlagen')
    }
  }

  useEffect(() => {
    return () => {
      stopGeo()
      stopMedia()
      if (wakeLockRef.current?.release) {
        wakeLockRef.current.release().catch(() => {})
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const requestNotifications = async () => {
    if (!supports?.notifications) return
    try {
      const res = await Notification.requestPermission()
      setNotifPermission(normalizeNotificationPermission(res))
    } catch {
      setNotifPermission('denied')
    }
  }

  const testNotification = async () => {
    if (!supports?.notifications) return
    if (Notification.permission !== 'granted') return

    try {
      new Notification('SmartDiary', {
        body: 'Test-Benachrichtigung (wenn vom Browser unterstützt).',
      })
    } catch {
      // Some browsers require SW-based notifications.
    }
  }

  const doShare = async () => {
    if (!supports?.share) return
    try {
      await navigator.share({
        title: 'SmartDiary',
        text: 'SmartDiary PWA',
        url: window.location.href,
      })
    } catch {
      // user cancelled
    }
  }

  const writeClipboard = async () => {
    if (!supports?.clipboard) return
    try {
      await navigator.clipboard.writeText(`SmartDiary @ ${new Date().toISOString()}`)
    } catch {
      // ignore
    }
  }

  const vibrate = () => {
    if (!supports?.vibration) return
    navigator.vibrate(200)
  }

  const requestWakeLock = async () => {
    if (!supports?.wakeLock) return
    try {
      const anyNav = navigator as any
      wakeLockRef.current = await anyNav.wakeLock.request('screen')
      setWakeLockActive(true)

      wakeLockRef.current.addEventListener?.('release', () => {
        setWakeLockActive(false)
      })
    } catch {
      setWakeLockActive(false)
    }
  }

  const releaseWakeLock = async () => {
    try {
      await wakeLockRef.current?.release?.()
    } catch {
      // ignore
    }
    wakeLockRef.current = null
    setWakeLockActive(false)
  }

  const visibleCards = useMemo(() => {
    // “Was nicht geht, soll ausgeblendet werden.”
    // => Only show features that are supported by feature detection.
    return {
      geolocation: supports?.geolocation,
      motion: supports?.motion,
      orientation: supports?.orientation,
      media: supports?.camera || supports?.microphone,
      battery: supports?.battery,
      connection: supports?.connection,
      storage: supports?.storage,
      notifications: supports?.notifications,
      share: supports?.share,
      clipboard: supports?.clipboard,
      vibration: supports?.vibration,
      wakeLock: supports?.wakeLock,
    }
  }, [supports])

  // Show loading state until client-side detection is complete
  if (!supports) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <p className="text-center text-gray-600 dark:text-gray-300">Erkenne Gerätefunktionen...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-start justify-between gap-6 flex-col md:flex-row">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">📱 Sensoren & Gerätefunktionen</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Diese Seite nutzt nur die Web-APIs, die dein Gerät/Browser wirklich unterstützt.
            Auf iOS/WebKit müssen einige Sensoren per Tap bestätigt werden.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 w-full md:w-auto">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <div><span className="font-medium">Online:</span> {boolLabel(online)}</div>
            <div><span className="font-medium">Secure Context (HTTPS):</span> {boolLabel(secureContext)}</div>
          </div>
        </div>
      </div>

      {!secureContext && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">⚠️ Hinweis</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Viele Sensor-/Medien-APIs funktionieren nur über HTTPS. Lokal ist meist nur
            <span className="font-medium"> localhost </span>
            erlaubt.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {visibleCards.geolocation && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">📍 Standort (Geolocation)</h2>
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              <div><span className="font-medium">Permission:</span> {geoPermission}</div>
              <div><span className="font-medium">Status:</span> {geoState.status}</div>
            </div>

            {geoState.status === 'watching' && (
              <div className="text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                <div><span className="font-medium">Lat:</span> {formatNumber(geoState.coords.latitude)}</div>
                <div><span className="font-medium">Lon:</span> {formatNumber(geoState.coords.longitude)}</div>
                <div><span className="font-medium">Accuracy:</span> {Math.round(geoState.coords.accuracy)} m</div>
              </div>
            )}

            {geoState.status === 'error' && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                {geoState.message}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={startGeo}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                Start
              </button>
              <button
                onClick={stopGeo}
                className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-lg transition dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
              >
                Stop
              </button>
            </div>
          </div>
        )}

        {visibleCards.motion && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">🏃 Bewegung (DeviceMotion)</h2>
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              <div><span className="font-medium">Permission:</span> {motionPermission}</div>
            </div>

            <div className="flex gap-3 mb-4">
              <button
                onClick={requestMotion}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                Zugriff bestätigen
              </button>
            </div>

            {motionPermission === 'granted' && (
              <div className="text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div><span className="font-medium">ax:</span> {motionData?.ax ?? '—'}</div>
                <div><span className="font-medium">ay:</span> {motionData?.ay ?? '—'}</div>
                <div><span className="font-medium">az:</span> {motionData?.az ?? '—'}</div>
              </div>
            )}
          </div>
        )}

        {visibleCards.orientation && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">🧭 Ausrichtung (DeviceOrientation)</h2>
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              <div><span className="font-medium">Permission:</span> {orientationPermission}</div>
            </div>

            <div className="flex gap-3 mb-4">
              <button
                onClick={requestOrientation}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                Zugriff bestätigen
              </button>
            </div>

            {orientationPermission === 'granted' && (
              <div className="text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div><span className="font-medium">alpha:</span> {orientationData?.alpha ?? '—'}</div>
                <div><span className="font-medium">beta:</span> {orientationData?.beta ?? '—'}</div>
                <div><span className="font-medium">gamma:</span> {orientationData?.gamma ?? '—'}</div>
              </div>
            )}
          </div>
        )}

        {visibleCards.media && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">📷 Kamera / 🎙️ Mikrofon</h2>
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {supports?.camera && <div><span className="font-medium">Camera permission:</span> {cameraPermission}</div>}
              {supports?.microphone && <div><span className="font-medium">Mic permission:</span> {micPermission}</div>}
              <div><span className="font-medium">Aktiv:</span> {boolLabel(mediaActive)}</div>
            </div>

            {mediaError && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                {mediaError}
              </div>
            )}

            {supports?.camera && (
              <div className="mb-4">
                <video ref={videoRef} className="w-full rounded-lg bg-black" playsInline muted />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={startCameraAndMic}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                Zugriff anfragen
              </button>
              <button
                onClick={stopMedia}
                className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-lg transition dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
              >
                Stop
              </button>
            </div>
          </div>
        )}

        {visibleCards.notifications && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">🔔 Benachrichtigungen</h2>
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              <div><span className="font-medium">Permission:</span> {notifPermission}</div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={requestNotifications}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                Permission anfragen
              </button>
              <button
                onClick={testNotification}
                className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-lg transition dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
              >
                Test
              </button>
            </div>
          </div>
        )}

        {visibleCards.share && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">📤 Web Share</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Nutzt das native Share-Sheet (wenn unterstützt).
            </p>
            <button
              onClick={doShare}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Teilen
            </button>
          </div>
        )}

        {visibleCards.clipboard && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">📋 Clipboard</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Schreibt einen kurzen Text in die Zwischenablage (User-Geste erforderlich).
            </p>
            <button
              onClick={writeClipboard}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              In Zwischenablage schreiben
            </button>
          </div>
        )}

        {visibleCards.vibration && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">📳 Vibration</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Kurzer Vibrationsimpuls (meist Android).
            </p>
            <button
              onClick={vibrate}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Vibrieren
            </button>
          </div>
        )}

        {visibleCards.wakeLock && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">🌙 Wake Lock</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Hält den Bildschirm wach (wenn unterstützt).
            </p>
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              <div><span className="font-medium">Aktiv:</span> {boolLabel(wakeLockActive)}</div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={requestWakeLock}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                Aktivieren
              </button>
              <button
                onClick={releaseWakeLock}
                className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-lg transition dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
              >
                Deaktivieren
              </button>
            </div>
          </div>
        )}

        {visibleCards.battery && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">🔋 Batterie</h2>
            {batteryState.status === 'loading' && (
              <p className="text-sm text-gray-600 dark:text-gray-300">Lade…</p>
            )}
            {batteryState.status === 'ready' && (
              <div className="text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div><span className="font-medium">Ladestand:</span> {Math.round(batteryState.level * 100)}%</div>
                <div><span className="font-medium">Lädt:</span> {boolLabel(batteryState.charging)}</div>
              </div>
            )}
            {batteryState.status === 'unsupported' && (
              <p className="text-sm text-gray-600 dark:text-gray-300">Nicht verfügbar.</p>
            )}
          </div>
        )}

        {visibleCards.connection && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">📶 Netzwerk-Infos</h2>
            <div className="text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div><span className="font-medium">Effective type:</span> {connectionInfo?.effectiveType ?? '—'}</div>
              <div><span className="font-medium">Downlink:</span> {connectionInfo?.downlink ?? '—'}</div>
              <div><span className="font-medium">RTT:</span> {connectionInfo?.rtt ?? '—'}</div>
            </div>
          </div>
        )}

        {visibleCards.storage && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">💾 Storage</h2>
            <div className="text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div><span className="font-medium">Usage:</span> {storageEstimate?.usage ?? '—'}</div>
              <div><span className="font-medium">Quota:</span> {storageEstimate?.quota ?? '—'}</div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">🧩 PWA</h2>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          Wenn dein Browser es unterstützt, kannst du SmartDiary als App installieren ("Zum Home-Bildschirm")
          und offline in einem eingeschränkten Modus nutzen.
        </p>
      </div>
    </div>
  )
}
