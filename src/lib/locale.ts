'use server'

import { cookies } from 'next/headers'
import type { Locale } from '../i18n/locales'

export async function setLocale(locale: Locale): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set('spark-lang', locale, {
    path: '/',
    sameSite: 'lax',
  })
}
