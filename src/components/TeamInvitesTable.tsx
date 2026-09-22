import { getTranslations } from 'next-intl/server'
import { Badge } from '@spark/ui'
import type { BadgeVariant } from '@spark/ui'
import type { TeamInviteStatus, TeamMemberInvite } from '@/lib/team-types'

interface Props {
  items: TeamMemberInvite[]
}

const STATUS_BADGE: Record<TeamInviteStatus, { labelKey: string; variant: BadgeVariant }> = {
  PENDING: { labelKey: 'invites.status.pending', variant: 'warn' },
  ACCEPTED: { labelKey: 'invites.status.accepted', variant: 'ok' },
  EXPIRED: { labelKey: 'invites.status.expired', variant: 'bad' },
  REVOKED: { labelKey: 'invites.status.revoked', variant: 'neutral' },
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export async function TeamInvitesTable({ items }: Props) {
  const t = await getTranslations('team')
  const tRole = await getTranslations('team.roleOptions')

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>{t('invites.table.email')}</th>
            <th>{t('invites.table.role')}</th>
            <th>{t('invites.table.status')}</th>
            <th>{t('invites.table.expiresAt')}</th>
            <th>{t('invites.table.createdAt')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const badge = STATUS_BADGE[item.status]
            return (
              <tr key={item.id}>
                <td className="table-facility">{item.email}</td>
                <td className="text-secondary">{tRole(item.role)}</td>
                <td>
                  <Badge variant={badge.variant}>{t(badge.labelKey)}</Badge>
                </td>
                <td className="text-secondary">{dateFmt.format(new Date(item.expiresAt))}</td>
                <td className="text-secondary">{dateFmt.format(new Date(item.createdAt))}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
