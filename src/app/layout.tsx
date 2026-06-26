import type { Metadata } from 'next'
import { Inter, Montserrat_Alternates } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'greek'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
})

const montserratAlternates = Montserrat_Alternates({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'sPark Admin',
  description: 'Operator and platform administration for sPark.',
  icons: { icon: '/icon.png', apple: '/icon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el" className={`${inter.variable} ${montserratAlternates.variable}`}>
      <body>{children}</body>
    </html>
  )
}
