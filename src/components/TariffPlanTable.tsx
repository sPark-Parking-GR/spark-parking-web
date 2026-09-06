import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Archive, Trash2 } from 'lucide-react'
import { Badge } from '@spark/ui'
import { LifecycleActionButton } from './LifecycleActionButton'
import type { TariffPlanListItem } from '@/lib/tariff-api'

interface Props {
  items: TariffPlanListItem[]
  basePath?: string
  showOperator?: boolean
  canWrite?: boolean
  canPurge?: boolean
}

type Translator = Awaited<ReturnType<typeof getTranslations>>

// Every other table in the product formats dates through an explicit en-GB formatter;
// toLocaleDateString() followed the server's locale instead, so this one table rendered
// "8/31/2026" beside "31 Aug 2026" everywhere else.
const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function formatValidity(from: string | null, to: string | null, t: Translator): string {
  if (!from && !to) return t('table.validityAlways')
  const fmt = (iso: string) => dateFmt.format(new Date(iso))
  if (from && to) return t('table.validityRange', { from: fmt(from), to: fmt(to) })
  if (from) return t('table.validityFrom', { date: fmt(from) })
  return t('table.validityUntil', { date: fmt(to as string) })
}

export async function TariffPlanTable({
  items,
  basePath = '/dashboard/tariffs',
  showOperator = false,
  canWrite = false,
  canPurge = false,
}: Props) {
  const t = await getTranslations('tariffs')
  const showActions = canWrite || canPurge

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>{t('table.name')}</th>
            {showOperator ? <th>{t('table.operator')}</th> : null}
            <th>{t('table.status')}</th>
            <th>{t('table.vehicles')}</th>
            <th>{t('table.validity')}</th>
            <th>{t('table.version')}</th>
            <th>{t('table.updated')}</th>
            {showActions ? <th>{t('table.actions')}</th> : null}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <Link href={`${basePath}/${item.id}`} className="table-link">
                  {item.name}
                </Link>
                {item.isDefault ? <Badge variant="neutral">{t('table.default')}</Badge> : null}
              </td>
              {showOperator ? <td className="text-secondary">{item.operatorName}</td> : null}
              <td>
                {item.isActive ? (
                  <Badge variant="ok">{t('table.active')}</Badge>
                ) : (
                  <Badge variant="neutral">{t('table.inactive')}</Badge>
                )}
              </td>
              <td className="text-secondary">{item.vehicleTypes.join(', ')}</td>
              <td className="text-secondary">{formatValidity(item.validFrom, item.validTo, t)}</td>
              <td>v{item.version}</td>
              <td className="text-secondary">{dateFmt.format(new Date(item.updatedAt))}</td>
              {showActions ? (
                <td>
                  <div className="table-actions">
                    {canWrite && item.lifecycleStatus === 'ACTIVE' ? (
                      <LifecycleActionButton
                        resourceType="tariff-plan"
                        resourceId={item.id}
                        resourceLabel={item.name}
                        action="archive"
                        icon={<Archive size={18} strokeWidth={2} aria-hidden="true" />}
                        iconOnly
                      />
                    ) : null}
                    {canPurge && item.lifecycleStatus === 'ACTIVE' ? (
                      <LifecycleActionButton
                        resourceType="tariff-plan"
                        resourceId={item.id}
                        resourceLabel={item.name}
                        action="tombstone"
                        icon={<Trash2 size={18} strokeWidth={2} aria-hidden="true" />}
                        iconOnly
                      />
                    ) : null}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
