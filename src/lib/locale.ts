'use server'

import { cookies } from 'next/headers'
import type { Locale } from '../i18n/locales'

// Without a lifetime this is a session cookie and the choice is forgotten when the browser closes.
const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

export async function setLocale(locale: Locale): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set('spark-lang', locale, {
    path: '/',
    sameSite: 'lax',
    maxAge: LOCALE_COOKIE_MAX_AGE_SECONDS,
  })
}
