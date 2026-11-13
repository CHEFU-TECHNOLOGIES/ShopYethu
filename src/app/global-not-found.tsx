import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import { siteIcons } from '@/lib/site-icons'
import NotFound from './(frontend)/not-found'
import './(frontend)/styles.css'

export const metadata: Metadata = { title: 'Page not found | ShopYethu', icons: siteIcons }

export default function GlobalNotFound() {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <NotFound />
        </ThemeProvider>
      </body>
    </html>
  )
}
