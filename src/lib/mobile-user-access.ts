import { hasPlatformPermission } from '@spark/types'
import type { PlatformPermission } from '@spark/types'
import { getActiveSession } from './session'

type MobilePermission = Extract<PlatformPermission, `identity:mobile.${string}`>

export class MobileAccessDeniedError extends Error {
  constructor() {
    super('Not permitted')
    this.name = 'MobileAccessDeniedError'
  }
}

// Re-resolved from the session on every call: nav hiding and the page guard are only
// conveniences, and a server action is a public POST endpoint that must stand on its own.
export async function assertMobilePermission(permission: MobilePermission): Promise<void> {
  const session = await getActiveSession()
  if (
    !session.accessToken ||
    !session.user ||
    !hasPlatformPermission(session.user.role, permission)
  ) {
    throw new MobileAccessDeniedError()
  }
}
