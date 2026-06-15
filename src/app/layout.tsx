import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Parqin — Make Parking Smart',
  description: 'Find, compare, and book parking in Greece.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el">
      <body>{children}</body>
    </html>
  )
}
