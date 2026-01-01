import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SmartDiary',
    short_name: 'SmartDiary',
    description: 'KI-gestütztes Tagebuch-, Reise- und Lebenslog-System',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/maskable-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
