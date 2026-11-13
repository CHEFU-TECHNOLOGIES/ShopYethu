import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { siteIcons } from '@/lib/site-icons'
import './styles.css'

const title = 'ShopYethu Admin'
const description = 'Marketplace operations for ShopYethu staff'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://shopyethu-admin.chefu.co.za'),
  title,
  description,
  icons: siteIcons,
  openGraph: { title, description },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <div id="root">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  )
}
