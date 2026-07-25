import { getTranslations } from 'next-intl/server'
import { Badge } from '@spark/ui'
import type { BadgeVariant } from '@spark/ui'
import { RevokeInviteButton } from './RevokeInviteButton'
import type { InviteStatus, InviteSummary } from '@/lib/invite-actions'

interface Props {
  items: InviteSummary[]
}

const STATUS_BADGE: Record<InviteStatus, { labelKey: string; variant: BadgeVariant }> = {
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

export async function InviteTable({ items }: Props) {
  const t = await getTranslations('onboarding')

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>{t('table.businessName')}</th>
            <th>{t('table.email')}</th>
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
                <td className="table-facility">{item.businessName}</td>
                <td className="text-secondary">{item.email}</td>
                <td>
                  <Badge variant={badge.variant}>{t(badge.labelKey)}</Badge>
                </td>
                <td className="text-secondary">{dateFmt.format(new Date(item.expiresAt))}</td>
                <td className="text-secondary">{dateFmt.format(new Date(item.createdAt))}</td>
                <td>
                  {item.status === 'PENDING' ? (
                    <RevokeInviteButton id={item.id} />
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
