import { getTranslations } from 'next-intl/server'
import { Badge } from '@spark/ui'
import type { BadgeVariant } from '@spark/ui'
import { SuspendOperatorButton } from './SuspendOperatorButton'
import { ReactivateOperatorButton } from './ReactivateOperatorButton'
import type { OperatorStatus, OperatorSummary } from '@/lib/operator-actions'

interface Props {
  items: OperatorSummary[]
}

const STATUS_BADGE: Record<OperatorStatus, { labelKey: string; variant: BadgeVariant }> = {
  PENDING: { labelKey: 'operatorStatus.pending', variant: 'warn' },
  VERIFIED: { labelKey: 'operatorStatus.verified', variant: 'ok' },
  SUSPENDED: { labelKey: 'operatorStatus.suspended', variant: 'bad' },
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export async function OperatorsTable({ items }: Props) {
  const t = await getTranslations('onboarding')

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>{t('operatorTable.name')}</th>
            <th>{t('operatorTable.status')}</th>
            <th>{t('operatorTable.facilities')}</th>
            <th>{t('operatorTable.members')}</th>
            <th>{t('operatorTable.createdAt')}</th>
            <th>{t('operatorTable.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const badge = STATUS_BADGE[item.status]
            return (
              <tr key={item.id}>
                <td className="table-facility">{item.name}</td>
                <td>
                  <Badge variant={badge.variant}>{t(badge.labelKey)}</Badge>
                </td>
                <td className="text-secondary">{item.facilityCount}</td>
                <td className="text-secondary">{item.memberCount}</td>
                <td className="text-secondary">{dateFmt.format(new Date(item.createdAt))}</td>
                <td>
                  {item.status === 'VERIFIED' ? (
                    <SuspendOperatorButton id={item.id} />
                  ) : item.status === 'SUSPENDED' ? (
                    <ReactivateOperatorButton id={item.id} />
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
