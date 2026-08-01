const DAY_MS = 86_400_000

export function retentionDays(purgeAfter: string | null): number | null {
  if (!purgeAfter) return null
  const diffMs = new Date(purgeAfter).getTime() - Date.now()
  return Math.ceil(diffMs / DAY_MS)
}
