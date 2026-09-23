import { getFormatter, getTranslations } from 'next-intl/server'
import { AuditFilters } from '@/components/AuditFilters'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { SearchInput } from '@/components/SearchInput'
import { listAuditLog } from '@/lib/audit-api'
import { actionLabel, actionTone, formatRelativeTime } from '@/lib/audit-format'
import { buildQuery, loadPage, requireSession } from '@/lib/dal'

const PAGE_SIZE = 20

interface PageProps {
  searchParams: Promise<{ skip?: string; action?: string; actorQuery?: string }>
}

export default async function AuditPage({ searchParams }: PageProps) {
  await requireSession()

  const t = await getTranslations('insights.audit')
  const format = await getFormatter()
  const { skip: skipParam, action, actorQuery } = await searchParams
  const skip = Math.max(0, parseInt(skipParam ?? '0', 10) || 0)
  const actorQueryTrimmed = actorQuery?.trim() || undefined

  const { items, total } = await loadPage(
    () => listAuditLog({ skip, take: PAGE_SIZE, action, actorQuery: actorQueryTrimmed }),
    { redirects: { 403: '/dashboard' } },
  )

  const buildHref = (nextSkip: number) =>
    buildQuery('/admin/audit', { skip: nextSkip, action, actorQuery: actorQueryTrimmed })

  const hasFilters = Boolean(action || actorQueryTrimmed)

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <div className="table-toolbar">
        <SearchInput param="actorQuery" placeholder={t('filters.actorPlaceholder')} />
      </div>
      <div className="table-toolbar table-toolbar--filters">
        <AuditFilters />
      </div>

      {items.length === 0 ? (
        <div className="audit-card">
          <EmptyState
            title={t('emptyTitle')}
            message={hasFilters ? t('emptyFiltered') : t('emptyMessage')}
          />
        </div>
      ) : (
        <>
          <div className="audit-card">
            {items.map((entry) => {
              const absolute = format.dateTime(new Date(entry.createdAt), {
                dateStyle: 'medium',
                timeStyle: 'short',
              })
              return (
                <div key={entry.id} className={`audit-row audit-row--${actionTone(entry.action)}`}>
                  <span className="audit-row__avatar" aria-hidden="true">
                    <span className="audit-row__dot" />
                  </span>
                  <div className="audit-row__body">
                    <p className="audit-row__line">
                      <b className="audit-row__actor">{entry.actorName ?? t('system')}</b>{' '}
                      {actionLabel(t, entry.action)}
                    </p>
                    <p className="audit-row__target" title={entry.entityId}>
                      {entry.entityType} ·{' '}
                      {entry.entityLabel
                        ? `${entry.entityLabel} (${entry.entityId.slice(0, 10)})`
                        : entry.entityId.slice(0, 10)}
                    </p>
                  </div>
                  <time className="audit-row__when" dateTime={entry.createdAt} title={absolute}>
                    {formatRelativeTime(entry.createdAt, t)}
                  </time>
                </div>
              )
            })}
          </div>
          <Pagination skip={skip} take={PAGE_SIZE} total={total} buildHref={buildHref} />
        </>
      )}
    </>
  )
}
