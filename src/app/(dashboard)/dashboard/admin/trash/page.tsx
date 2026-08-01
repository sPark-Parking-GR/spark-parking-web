import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { AlertCircle } from 'lucide-react'
import { hasPlatformPermission } from '@spark/types'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { TrashFilters } from '@/components/TrashFilters'
import { TrashTable } from '@/components/TrashTable'
import { Pagination } from '@/components/Pagination'
import { ApiError, AuthRequiredError } from '@/lib/api'
import { buildQuery, requireSession } from '@/lib/dal'
import { listTrash, LIFECYCLE_RESOURCE_TYPES, LIFECYCLE_STATUSES } from '@/lib/lifecycle-api'
import type {
  LifecycleResourceType,
  LifecycleStatus,
  LifecycleTrashListResponse,
} from '@/lib/lifecycle-api'

const PAGE_SIZE = 20

interface PageProps {
  searchParams: Promise<{ resourceType?: string; status?: string; skip?: string }>
}

function parseResourceType(value: string | undefined): LifecycleResourceType | undefined {
  return LIFECYCLE_RESOURCE_TYPES.includes(value as LifecycleResourceType)
    ? (value as LifecycleResourceType)
    : undefined
}

function parseStatus(value: string | undefined): LifecycleStatus | undefined {
  return LIFECYCLE_STATUSES.includes(value as LifecycleStatus)
    ? (value as LifecycleStatus)
    : undefined
}

export default async function TrashPage({ searchParams }: PageProps) {
  const session = await requireSession()
  if (!hasPlatformPermission(session.user.role, 'platform:tenant.read')) {
    redirect('/dashboard')
  }
  const canWrite = hasPlatformPermission(session.user.role, 'platform:tenant.write')
  const canPurge = hasPlatformPermission(session.user.role, 'platform:tenant.purge')

  const t = await getTranslations('adminLifecycle.trash')
  const params = await searchParams
  const resourceType = parseResourceType(params.resourceType)
  const status = parseStatus(params.status)
  const skip = Math.max(0, parseInt(params.skip ?? '0', 10) || 0)

  let trash: LifecycleTrashListResponse | null = null
  let loadFailed = false
  try {
    trash = await listTrash({ resourceType, status, skip, take: PAGE_SIZE })
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError && err.status === 403) redirect('/login?error=restricted')
    loadFailed = true
  }

  const buildHref = (nextSkip: number) =>
    buildQuery('/dashboard/admin/trash', { resourceType, status, skip: nextSkip })

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <div className="table-toolbar table-toolbar--filters">
        <TrashFilters />
      </div>

      {loadFailed ? (
        <p className="form-banner form-banner--error" role="alert">
          <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
          {t('loadError')}
        </p>
      ) : trash && trash.items.length > 0 ? (
        <>
          <TrashTable items={trash.items} canWrite={canWrite} canPurge={canPurge} />
          <Pagination
            skip={skip}
            take={PAGE_SIZE}
            total={trash.total}
            buildHref={buildHref}
            sticky
          />
        </>
      ) : (
        <EmptyState
          title={t('empty.title')}
          message={resourceType || status ? t('emptyFiltered') : t('empty.message')}
        />
      )}
    </>
  )
}
