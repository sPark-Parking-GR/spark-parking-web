export const locales = ['en', 'el'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (locales as readonly string[]).includes(value)
}

function detectLocaleFromHeader(acceptLanguage: string | null): Locale | undefined {
  if (!acceptLanguage) return undefined
  for (const part of acceptLanguage.split(',')) {
    const primary = part.split(';')[0]?.trim().split('-')[0]?.toLowerCase()
    if (isLocale(primary)) return primary
  }
  return undefined
}

export function resolveLocale(cookieValue: string | undefined, acceptLanguage: string | null): Locale {
  if (isLocale(cookieValue)) return cookieValue
  return detectLocaleFromHeader(acceptLanguage) ?? defaultLocale
}
