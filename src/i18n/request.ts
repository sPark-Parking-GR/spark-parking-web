import { cookies } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import type { Locale } from './locales'
import { defaultLocale, isLocale } from './locales'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const stored = cookieStore.get('spark-lang')?.value
  const locale: Locale = isLocale(stored) ? stored : defaultLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
