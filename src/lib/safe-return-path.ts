export const DASHBOARD_HOME = '/dashboard'

// Only same-origin absolute paths are honored. Protocol-relative (`//host`),
// backslash-smuggled (`/\host`) and non-rooted values fall back to the home page,
// closing the open-redirect vector on the `from` query param.
export function safeReturnPath(from: string | undefined): string {
  if (!from || !from.startsWith('/')) return DASHBOARD_HOME
  if (from.startsWith('//') || from.startsWith('/\\')) return DASHBOARD_HOME
  return from
}
