import type { Metadata } from 'next'

export const siteIcons: Metadata['icons'] = {
  icon: [
    { url: '/favicon.svg', type: 'image/svg+xml' },
    { url: '/favicon-32.png', type: 'image/png', sizes: '32x32' },
  ],
  apple: { url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' },
}
