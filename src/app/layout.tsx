import type { Metadata } from 'next'
import { Inter, Montserrat_Alternates } from 'next/font/google'
import { cookies, headers } from 'next/headers'
import { NextIntlClientProvider } from 'next-intl'
import { colors, cssVarsFor, radii, shadows } from '@spark/ui'
import { AppThemeProvider } from '../components/AppThemeProvider'
import { resolveLocale } from '../i18n/locales'
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

const lightVars = cssVarsFor(colors.light, radii, shadows.light)
const darkVars = cssVarsFor(colors.dark, radii, shadows.dark)

const themeStyle = `
:root{${lightVars}}
:root[data-theme="dark"]{${darkVars}}
[data-theme="dark"]{${darkVars}}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){${darkVars}} }
:root[data-theme="light"]{${lightVars}}
`

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const headerStore = await headers()
  const locale = resolveLocale(cookieStore.get('spark-lang')?.value, headerStore.get('accept-language'))
  const messages = (await import(`../../messages/${locale}.json`)).default

  return (
    <html lang={locale} className={`${inter.variable} ${montserratAlternates.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeStyle }} />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppThemeProvider>{children}</AppThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
