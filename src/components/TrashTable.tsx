import { getTranslations } from 'next-intl/server'
import { Badge } from '@spark/ui'
import type { BadgeVariant } from '@spark/ui'
import { LifecycleActionButton } from './LifecycleActionButton'
import { retentionDays } from '@/lib/lifecycle-format'
import type { LifecycleTrashItem } from '@/lib/lifecycle-api'

interface Props {
  items: LifecycleTrashItem[]
  canWrite: boolean
  canPurge: boolean
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const STATUS_BADGE: Record<LifecycleTrashItem['status'], BadgeVariant> = {
  ARCHIVED: 'warn',
  TOMBSTONED: 'bad',
  PURGED: 'neutral',
}

export async function TrashTable({ items, canWrite, canPurge }: Props) {
  const t = await getTranslations('adminLifecycle')

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>{t('trash.table.name')}</th>
            <th>{t('trash.table.type')}</th>
            <th>{t('trash.table.status')}</th>
            <th>{t('trash.table.reason')}</th>
            <th>{t('trash.table.changedAt')}</th>
            <th>{t('trash.table.retention')}</th>
            <th>{t('trash.table.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const days = item.status === 'TOMBSTONED' ? retentionDays(item.purgeAfter) : null
            return (
              <tr key={`${item.resourceType}-${item.id}`}>
                <td className="table-facility">{item.name}</td>
                <td className="text-secondary">{t(`resourceType.${item.resourceType}`)}</td>
                <td>
                  <Badge variant={STATUS_BADGE[item.status]}>{t(`status.${item.status}`)}</Badge>
                </td>
                <td className="text-secondary">{item.reason ?? t('trash.noReason')}</td>
                <td className="text-secondary">
                  {item.changedAt ? dateFmt.format(new Date(item.changedAt)) : t('trash.noReason')}
                </td>
                <td>
                  {days === null ? (
                    <span className="text-secondary">{t('trash.noReason')}</span>
                  ) : (
                    <Badge variant={days <= 0 ? 'bad' : days <= 3 ? 'warn' : 'neutral'}>
                      {days < 0
                        ? t('trash.retention.overdue')
                        : days === 0
                          ? t('trash.retention.today')
                          : days === 1
                            ? t('trash.retention.tomorrow')
                            : t('trash.retention.inDays', { count: days })}
                    </Badge>
                  )}
                </td>
                <td>
                  <div className="table-actions">
                    {canWrite && item.status !== 'PURGED' ? (
                      <LifecycleActionButton
                        resourceType={item.resourceType}
                        resourceId={item.id}
                        resourceLabel={item.name}
                        action="restore"
                      />
                    ) : null}
                    {canPurge && item.status === 'ARCHIVED' ? (
                      <LifecycleActionButton
                        resourceType={item.resourceType}
                        resourceId={item.id}
                        resourceLabel={item.name}
                        action="tombstone"
                        triggerClassName="btn btn--sm btn--danger"
                      />
                    ) : null}
                    {canPurge && item.status === 'TOMBSTONED' ? (
                      <LifecycleActionButton
                        resourceType={item.resourceType}
                        resourceId={item.id}
                        resourceLabel={item.name}
                        action="purge"
                        triggerClassName="btn btn--sm btn--danger"
                      />
                    ) : null}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
