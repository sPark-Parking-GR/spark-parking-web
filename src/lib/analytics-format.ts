import type { RevenueBucket } from './analytics-api'

const percentFmt = new Intl.NumberFormat('en-GB', { style: 'percent', maximumFractionDigits: 1 })

export function formatRatio(ratio: number): string {
  return percentFmt.format(ratio)
}

const dayLabelFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
})

const monthLabelFmt = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

export function formatBucketLabel(iso: string, bucket: RevenueBucket): string {
  const date = new Date(iso)
  return bucket === 'month' ? monthLabelFmt.format(date) : dayLabelFmt.format(date)
}

export function formatHours(minutes: number, formatNumber: (value: number) => string): string {
  return `${formatNumber(Math.round(minutes / 60))}h`
}
