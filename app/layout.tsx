import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Setu — Continuity of care',
  description: 'A grounded continuity-of-care workspace for reconciling clinical records across hospitals.',
  generator: 'Setu',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f4f1e9',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="bg-[var(--paper)]">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
