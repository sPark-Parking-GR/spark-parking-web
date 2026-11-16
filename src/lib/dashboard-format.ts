import type { RevenueBucket } from './analytics-api'

export function intlLocale(locale: string): string {
  return locale === 'el' ? 'el-GR' : 'en-IE'
}

export interface DashboardFormatters {
  number: (value: number) => string
  percent: (ratio: number) => string
  money: (cents: number, currency: string) => string
  moneyAxis: (cents: number, currency: string) => string
  hours: (minutes: number) => string
  bucketShort: (iso: string, bucket: RevenueBucket) => string
  bucketLong: (iso: string, bucket: RevenueBucket) => string
}

const COMPACT_THRESHOLD_CENTS = 1_000_000

export function createDashboardFormatters(locale: string): DashboardFormatters {
  const tag = intlLocale(locale)
  const number = new Intl.NumberFormat(tag, { maximumFractionDigits: 0 })
  const percent = new Intl.NumberFormat(tag, { style: 'percent', maximumFractionDigits: 1 })
  const dayShort = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short', timeZone: 'UTC' })
  const monthShort = new Intl.DateTimeFormat(tag, { month: 'short', timeZone: 'UTC' })
  const monthLong = new Intl.DateTimeFormat(tag, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
  const moneyCache = new Map<string, Intl.NumberFormat>()
  const moneyFor = (currency: string, compact: boolean): Intl.NumberFormat => {
    const key = `${currency}:${compact}`
    let cached = moneyCache.get(key)
    if (!cached) {
      cached = new Intl.NumberFormat(
        tag,
        compact
          ? { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }
          : { style: 'currency', currency },
      )
      moneyCache.set(key, cached)
    }
    return cached
  }

  return {
    number: (value) => number.format(value),
    percent: (ratio) => percent.format(ratio),
    money: (cents, currency) => moneyFor(currency, false).format(cents / 100),
    moneyAxis: (cents, currency) =>
      cents >= COMPACT_THRESHOLD_CENTS
        ? moneyFor(currency, true).format(cents / 100)
        : new Intl.NumberFormat(tag, {
            style: 'currency',
            currency,
            maximumFractionDigits: 0,
          }).format(cents / 100),
    hours: (minutes) => number.format(Math.round(minutes / 60)),
    bucketShort: (iso, bucket) =>
      (bucket === 'month' ? monthShort : dayShort).format(new Date(iso)),
    bucketLong: (iso, bucket) => (bucket === 'month' ? monthLong : dayShort).format(new Date(iso)),
  }
}
