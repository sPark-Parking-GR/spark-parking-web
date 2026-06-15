export function formatMoney(cents: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('el-GR', { style: 'currency', currency }).format(cents / 100)
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`
  return `${(meters / 1000).toFixed(1)} km`
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('el-GR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export function formatTimeRange(startIso: string, endIso: string): string {
  return `${formatDateTime(startIso)} → ${formatDateTime(endIso)}`
}
