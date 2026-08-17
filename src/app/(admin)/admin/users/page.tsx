import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { AlertCircle } from 'lucide-react'
import { hasPlatformPermission } from '@spark/types'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { SearchInput } from '@/components/SearchInput'
import { UsersFilters } from '@/components/UsersFilters'
import { UsersTable } from '@/components/UsersTable'
import { Pagination } from '@/components/Pagination'
import { ApiError, AuthRequiredError } from '@/lib/api'
import { buildQuery, requireSession } from '@/lib/dal'
import { listUsers, IDENTITY_LIFECYCLE_STATUSES, IDENTITY_ROLES } from '@/lib/identity-api'
import type {
  IdentityLifecycleStatus,
  IdentityRole,
  IdentityUserListResponse,
} from '@/lib/identity-api'

const PAGE_SIZE = 20

interface PageProps {
  searchParams: Promise<{ q?: string; role?: string; lifecycleStatus?: string; skip?: string }>
}

function parseRole(value: string | undefined): IdentityRole | undefined {
  return IDENTITY_ROLES.includes(value as IdentityRole) ? (value as IdentityRole) : undefined
}

function parseLifecycleStatus(value: string | undefined): IdentityLifecycleStatus | undefined {
  return IDENTITY_LIFECYCLE_STATUSES.includes(value as IdentityLifecycleStatus)
    ? (value as IdentityLifecycleStatus)
    : undefined
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const session = await requireSession()
  if (!hasPlatformPermission(session.user.role, 'identity:user.read')) {
    redirect('/dashboard')
  }

  const t = await getTranslations('adminUsers')
  const params = await searchParams
  const q = params.q?.trim() ?? ''
  const role = parseRole(params.role)
  const lifecycleStatus = parseLifecycleStatus(params.lifecycleStatus)
  const skip = Math.max(0, parseInt(params.skip ?? '0', 10) || 0)

  let users: IdentityUserListResponse | null = null
  let loadFailed = false
  try {
    users = await listUsers({
      q: q || undefined,
      role,
      lifecycleStatus,
      skip,
      take: PAGE_SIZE,
    })
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError && err.status === 403) redirect('/login?error=restricted')
    loadFailed = true
  }

  const buildHref = (nextSkip: number) =>
    buildQuery('/admin/users', { q, role, lifecycleStatus, skip: nextSkip })

  const hasFilters = Boolean(q || role || lifecycleStatus)

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <div className="table-toolbar">
        <SearchInput placeholder={t('searchPlaceholder')} />
      </div>
      <div className="table-toolbar table-toolbar--filters">
        <UsersFilters />
      </div>

      {loadFailed ? (
        <p className="form-banner form-banner--error" role="alert">
          <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
          {t('loadError')}
        </p>
      ) : users && users.items.length > 0 ? (
        <>
          <UsersTable items={users.items} />
          <Pagination
            skip={skip}
            take={PAGE_SIZE}
            total={users.total}
            buildHref={buildHref}
            sticky
          />
        </>
      ) : (
        <EmptyState
          title={t('empty.title')}
          message={hasFilters ? t('emptyFiltered') : t('empty.message')}
        />
      )}
    </>
  )
}
