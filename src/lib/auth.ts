import { createAuthContext } from '@parqin/auth'
import type { AuthProviderConfig } from '@parqin/auth'

function getAuthConfig(): AuthProviderConfig {
  const provider = (process.env['AUTH_PROVIDER'] ?? 'authjs') as AuthProviderConfig['provider']

  switch (provider) {
    case 'authjs':
      return { provider: 'authjs', config: { secret: process.env['AUTH_SECRET']! } }
    case 'clerk':
      return {
        provider: 'clerk',
        config: {
          secretKey: process.env['CLERK_SECRET_KEY']!,
          publishableKey: process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY']!,
        },
      }
    case 'supabase':
      return {
        provider: 'supabase',
        config: {
          url: process.env['NEXT_PUBLIC_SUPABASE_URL']!,
          serviceRoleKey: process.env['SUPABASE_SERVICE_ROLE_KEY']!,
        },
      }
    default:
      return { provider: 'authjs', config: { secret: process.env['AUTH_SECRET']! } }
  }
}

export const auth = createAuthContext(getAuthConfig())
