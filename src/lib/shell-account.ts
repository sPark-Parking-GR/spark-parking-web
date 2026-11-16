export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]
  if (!first) return '?'
  const last = parts[parts.length - 1]
  if (parts.length === 1 || !last) return first.slice(0, 2).toUpperCase()
  return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase()
}

export interface ShellAccount {
  name: string
  email: string
  roleLabel: string
  initials: string
}
