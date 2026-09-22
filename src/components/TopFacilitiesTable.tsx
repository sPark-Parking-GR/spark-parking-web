import { getTranslations } from 'next-intl/server'
import { formatMoney } from '@/lib/booking-format'
import type { TopFacility } from '@/lib/analytics-api'

interface Props {
  items: TopFacility[]
  currency: string
}

export async function TopFacilitiesTable({ items, currency }: Props) {
  const t = await getTranslations('insights.analytics.topFacilitiesPanel.table')

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>{t('facility')}</th>
            <th className="table-amount">{t('bookings')}</th>
            <th className="table-amount">{t('revenue')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={`${item.facilityId}-${item.operatorId}`}>
              <td className="table-facility">{item.facilityName}</td>
              <td className="table-amount">{item.bookingCount}</td>
              <td className="table-amount">{formatMoney(item.netRevenueCents, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
