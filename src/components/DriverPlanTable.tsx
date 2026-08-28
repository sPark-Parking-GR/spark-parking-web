import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Badge } from '@spark/ui'
import { ArchivePlanButton } from './driver-plans/ArchivePlanButton'
import { formatMoney } from '@/lib/booking-format'
import type { DriverPlan } from '@/lib/driver-plan-types'

interface Props {
  items: DriverPlan[]
  basePath: string
}

export async function DriverPlanTable({ items, basePath }: Props) {
  const t = await getTranslations('driverPlans')

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>{t('table.name')}</th>
            <th>{t('table.code')}</th>
            <th>{t('table.price')}</th>
            <th>{t('table.interval')}</th>
            <th>{t('table.visibility')}</th>
            <th>{t('table.subscribers')}</th>
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
              <td className="text-secondary">{t(`interval.${item.interval}`)}</td>
              <td>
                {item.isPublic ? (
                  <Badge variant="ok">{t('table.public')}</Badge>
                ) : (
                  <Badge variant="neutral">{t('table.private')}</Badge>
                )}
              </td>
              <td>{item.subscribers}</td>
              <td>
                {item.lifecycleStatus === 'ACTIVE' ? (
                  <Badge variant="ok">{t(`lifecycle.${item.lifecycleStatus}`)}</Badge>
                ) : (
                  <Badge variant="neutral">{t(`lifecycle.${item.lifecycleStatus}`)}</Badge>
                )}
              </td>
              <td>
                <div className="table-actions">
                  {item.lifecycleStatus === 'ACTIVE' ? (
                    <ArchivePlanButton
                      planId={item.id}
                      planName={item.name}
                      subscribers={item.subscribers}
                      iconOnly
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
