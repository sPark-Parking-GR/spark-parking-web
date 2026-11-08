import type { Metadata, Viewport } from 'next'
import { Inter, Montserrat_Alternates } from 'next/font/google'
import { cookies, headers } from 'next/headers'
import { NextIntlClientProvider } from 'next-intl'
import { colors, cssVarsFor, radii, shadows } from '@spark/ui'
import { AppThemeProvider } from '../components/AppThemeProvider'
import { DocumentTitle } from '../components/DocumentTitle'
import { PageTransitionOverlayProvider } from '../components/PageTransitionOverlay'
import { resolveLocale } from '../i18n/locales'
import { authThemeVars } from '../lib/auth-theme'
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
  title: 'sPark Portal',
  description: 'Operator and platform administration for sPark.',
  icons: { icon: '/icon.png', apple: '/icon.png' },
}

// cover lets the shell pad itself with env(safe-area-inset-*) on notched phones.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

const lightVars = cssVarsFor(colors.light, radii, shadows.light)
const darkVars = cssVarsFor(colors.dark, radii, shadows.dark)

// Dark is the default: it applies until the system says it prefers light, and an explicit
// choice (data-theme, set from localStorage before first paint) always wins over both.
const themeStyle = `
:root{${darkVars}${authThemeVars('dark')}}
@media (prefers-color-scheme: light){ :root:not([data-theme="dark"]){${lightVars}${authThemeVars('light')}} }
:root[data-theme="dark"]{${darkVars}${authThemeVars('dark')}}
[data-theme="dark"]{${darkVars}}
:root[data-theme="light"]{${lightVars}${authThemeVars('light')}}
`

// Runs before first paint so a remembered theme never flashes the other one. Storage can be
// blocked (private mode), hence the try/catch.
const themeBootScript = `try{var t=localStorage.getItem('spark-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const headerStore = await headers()
  const locale = resolveLocale(
    cookieStore.get('spark-lang')?.value,
    headerStore.get('accept-language'),
  )
  const messages = (await import(`../../messages/${locale}.json`)).default

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${montserratAlternates.variable}`}
      suppressHydrationWarning
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeStyle }} />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <DocumentTitle />
          <AppThemeProvider>
            <PageTransitionOverlayProvider>{children}</PageTransitionOverlayProvider>
          </AppThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
