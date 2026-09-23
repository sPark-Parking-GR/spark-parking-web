import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Badge } from '@spark/ui'
import type { BadgeVariant } from '@spark/ui'
import type {
  IdentityLifecycleStatus,
  IdentityRole,
  IdentityUserSummary,
} from '@/lib/identity-types'

interface Props {
  items: IdentityUserSummary[]
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const ROLE_BADGE_VARIANT: Record<IdentityRole, BadgeVariant> = {
  USER: 'neutral',
  OPERATOR_STAFF: 'neutral',
  OPERATOR_ADMIN: 'ok',
  PLATFORM_ADMIN: 'warn',
  SUPER_ADMIN: 'bad',
}

const LIFECYCLE_BADGE_VARIANT: Record<IdentityLifecycleStatus, BadgeVariant> = {
  ACTIVE: 'ok',
  ARCHIVED: 'warn',
  TOMBSTONED: 'bad',
  PURGED: 'neutral',
}

export async function UsersTable({ items }: Props) {
  const t = await getTranslations('adminUsers')

  return (
    <div className="table-wrapper fade-in">
      <table className="table">
        <thead>
          <tr>
            <th>{t('table.user')}</th>
            <th>{t('table.role')}</th>
            <th>{t('table.status')}</th>
            <th>{t('table.operators')}</th>
            <th>{t('table.created')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className="table-facility">
                <Link href={`/admin/users/${item.id}`} className="table-link">
                  {item.displayName ?? item.email}
                </Link>
                {item.displayName ? <span className="table__sub">{item.email}</span> : null}
              </td>
              <td>
                <Badge variant={ROLE_BADGE_VARIANT[item.role]}>{t(`role.${item.role}`)}</Badge>
              </td>
              <td>
                <div className="table-actions">
                  <Badge variant={LIFECYCLE_BADGE_VARIANT[item.lifecycleStatus]}>
                    {t(`status.${item.lifecycleStatus}`)}
                  </Badge>
                  {item.anonymisedAt ? <Badge variant="neutral">{t('anonymised')}</Badge> : null}
                </div>
              </td>
              <td className="text-secondary">
                {item.memberships.length > 0
                  ? item.memberships.map((m) => m.operatorName).join(', ')
                  : t('table.noOperators')}
              </td>
              <td className="text-secondary">{dateFmt.format(new Date(item.createdAt))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
