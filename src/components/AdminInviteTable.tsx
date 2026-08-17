import { getTranslations } from 'next-intl/server'
import { Badge } from '@spark/ui'
import type { BadgeVariant } from '@spark/ui'
import { ResendAdminInviteButton } from './ResendAdminInviteButton'
import { RevokeAdminInviteButton } from './RevokeAdminInviteButton'
import type { AdminInviteStatus, AdminInviteSummary } from '@/lib/admin-invite-types'

interface Props {
  items: AdminInviteSummary[]
}

const STATUS_BADGE: Record<AdminInviteStatus, { labelKey: string; variant: BadgeVariant }> = {
  PENDING: { labelKey: 'status.pending', variant: 'warn' },
  ACCEPTED: { labelKey: 'status.accepted', variant: 'ok' },
  EXPIRED: { labelKey: 'status.expired', variant: 'bad' },
  REVOKED: { labelKey: 'status.revoked', variant: 'neutral' },
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export async function AdminInviteTable({ items }: Props) {
  const t = await getTranslations('adminInvites')

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>{t('table.email')}</th>
            <th>{t('table.displayName')}</th>
            <th>{t('table.status')}</th>
            <th>{t('table.expiresAt')}</th>
            <th>{t('table.createdAt')}</th>
            <th>{t('table.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const badge = STATUS_BADGE[item.status]
            return (
              <tr key={item.id}>
                <td className="table-facility">{item.email}</td>
                <td className="text-secondary">{item.displayName ?? t('table.noDisplayName')}</td>
                <td>
                  <Badge variant={badge.variant}>{t(badge.labelKey)}</Badge>
                </td>
                <td className="text-secondary">{dateFmt.format(new Date(item.expiresAt))}</td>
                <td className="text-secondary">{dateFmt.format(new Date(item.createdAt))}</td>
                <td>
                  {item.status === 'PENDING' ? (
                    <div className="table-actions">
                      <ResendAdminInviteButton id={item.id} />
                      <RevokeAdminInviteButton id={item.id} />
                    </div>
                  ) : (
                    <span className="text-secondary">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
