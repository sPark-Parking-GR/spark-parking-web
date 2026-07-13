import { getTranslations } from 'next-intl/server'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { listAuditLog } from '@/lib/audit-api'
import { actionLabel, actionTone, formatRelativeTime } from '@/lib/audit-format'
import { buildQuery, loadPage, requireSession } from '@/lib/dal'

const PAGE_SIZE = 20

interface PageProps {
  searchParams: Promise<{ skip?: string }>
}

export default async function AuditPage({ searchParams }: PageProps) {
  await requireSession()

  const t = await getTranslations('insights.audit')
  const { skip: skipParam } = await searchParams
  const skip = Math.max(0, parseInt(skipParam ?? '0', 10) || 0)

  const { items, total } = await loadPage(() => listAuditLog({ skip, take: PAGE_SIZE }), {
    redirects: { 403: '/dashboard' },
  })

  const buildHref = (nextSkip: number) => buildQuery('/dashboard/audit', { skip: nextSkip })

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <p className="text-secondary audit-caption">{t('description')}</p>

      {items.length === 0 ? (
        <div className="audit-card">
          <EmptyState title={t('emptyTitle')} message={t('emptyMessage')} />
        </div>
      ) : (
        <>
          <div className="audit-card">
            {items.map((entry) => (
              <div key={entry.id} className={`audit-row audit-row--${actionTone(entry.action)}`}>
                <span className="audit-row__avatar" aria-hidden="true">
                  <span className="audit-row__dot" />
                </span>
                <div className="audit-row__body">
                  <p className="audit-row__line">
                    <b className="audit-row__actor">{entry.actorName ?? t('system')}</b>{' '}
                    {actionLabel(t, entry.action)}
                  </p>
                  <p className="audit-row__target">
                    {entry.entityType} · {entry.entityId.slice(0, 10)}
                  </p>
                </div>
                <span className="audit-row__when">{formatRelativeTime(entry.createdAt, t)}</span>
              </div>
            ))}
          </div>
          <Pagination skip={skip} take={PAGE_SIZE} total={total} buildHref={buildHref} />
        </>
      )}
    </>
  )
}
