import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Badge } from '@spark/ui'
import { MOBILE_STATUS_BADGE_VARIANT, formatMobileDate } from '@/lib/mobile-user-format'
import type { MobileUserSummary } from '@/lib/mobile-user-schema'

export async function MobileUsersTable({ items }: { items: MobileUserSummary[] }) {
  const t = await getTranslations('adminMobileUsers')

  return (
    <div className="table-wrapper fade-in">
      <table className="table">
        <thead>
          <tr>
            <th>{t('table.email')}</th>
            <th>{t('table.name')}</th>
            <th>{t('table.status')}</th>
            <th>{t('table.methods')}</th>
            <th>{t('table.bookings')}</th>
            <th>{t('table.created')}</th>
            <th>{t('table.lastActive')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className="table-facility">
                <Link href={`/admin/mobile-users/${item.id}`} className="table-link">
                  {item.email}
                </Link>
              </td>
              <td className="text-secondary">{item.displayName ?? t('table.noName')}</td>
              <td>
                <Badge variant={MOBILE_STATUS_BADGE_VARIANT[item.status]}>
                  {t(`status.${item.status}`)}
                </Badge>
              </td>
              <td>
                <div className="table-actions">
                  {item.methods.map((method) => (
                    <Badge key={method} variant="neutral">
                      {t(`provider.${method}`)}
                    </Badge>
                  ))}
                </div>
              </td>
              <td className="text-secondary">{item.bookingCount}</td>
              <td className="text-secondary">{formatMobileDate(item.createdAt)}</td>
              <td className="text-secondary">
                {item.lastActiveAt ? formatMobileDate(item.lastActiveAt) : t('table.never')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
