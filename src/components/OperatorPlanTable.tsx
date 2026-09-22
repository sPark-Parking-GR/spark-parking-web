import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Badge } from '@spark/ui'
import type { BadgeVariant } from '@spark/ui'
import { ArchivePlanButton } from './ArchivePlanButton'
import { formatMoney } from '@/lib/booking-format'
import type { OperatorPlanView } from '@/lib/operator-plan-api'
import type { SubscriptionLifecycleStatus } from '@spark/types'

interface Props {
  items: OperatorPlanView[]
  basePath: string
}

const LIFECYCLE_VARIANT: Record<SubscriptionLifecycleStatus, BadgeVariant> = {
  ACTIVE: 'ok',
  ARCHIVED: 'warn',
  TOMBSTONED: 'bad',
  PURGED: 'neutral',
}

export async function OperatorPlanTable({ items, basePath }: Props) {
  const t = await getTranslations('operatorPlans')

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>{t('table.name')}</th>
            <th>{t('table.code')}</th>
            <th>{t('table.price')}</th>
            <th>{t('table.interval')}</th>
            <th>{t('table.subscribers')}</th>
            <th>{t('table.visibility')}</th>
            <th>{t('table.status')}</th>
            <th>{t('table.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <Link href={`${basePath}/${item.id}`} className="table-link">
                  {item.name}
                </Link>
              </td>
              <td className="text-secondary mono">{item.code}</td>
              <td>{formatMoney(item.priceCents, item.currency)}</td>
              <td className="text-secondary">
                {t(`table.intervalValue.${item.interval === 'MONTHLY' ? 'monthly' : 'yearly'}`)}
              </td>
              <td>{item.subscribers}</td>
              <td>
                {item.isPublic ? (
                  <Badge variant="ok">{t('table.public')}</Badge>
                ) : (
                  <Badge variant="neutral">{t('table.private')}</Badge>
                )}
              </td>
              <td>
                <Badge variant={LIFECYCLE_VARIANT[item.lifecycleStatus]}>
                  {t(`table.lifecycle.${item.lifecycleStatus}`)}
                </Badge>
              </td>
              <td>
                <div className="table-actions">
                  {item.lifecycleStatus === 'ACTIVE' ? (
                    <ArchivePlanButton
                      planId={item.id}
                      planName={item.name}
                      subscribers={item.subscribers}
                    />
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
