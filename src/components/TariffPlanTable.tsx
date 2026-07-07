import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Badge } from '@spark/ui'
import type { TariffPlanListItem } from '@/lib/tariff-api'

interface Props {
  items: TariffPlanListItem[]
}

type Translator = Awaited<ReturnType<typeof getTranslations>>

function formatValidity(from: string | null, to: string | null, t: Translator): string {
  if (!from && !to) return t('table.validityAlways')
  const fmt = (iso: string) => new Date(iso).toLocaleDateString()
  if (from && to) return t('table.validityRange', { from: fmt(from), to: fmt(to) })
  if (from) return t('table.validityFrom', { date: fmt(from) })
  return t('table.validityUntil', { date: fmt(to as string) })
}

export async function TariffPlanTable({ items }: Props) {
  const t = await getTranslations('tariffs')

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>{t('table.name')}</th>
            <th>{t('table.status')}</th>
            <th>{t('table.vehicles')}</th>
            <th>{t('table.validity')}</th>
            <th>{t('table.version')}</th>
            <th>{t('table.updated')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <Link href={`/dashboard/tariffs/${item.id}`} className="table-link">
                  {item.name}
                </Link>
                {item.isDefault ? <Badge variant="neutral">{t('table.default')}</Badge> : null}
              </td>
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
              <td className="text-secondary">{new Date(item.updatedAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
