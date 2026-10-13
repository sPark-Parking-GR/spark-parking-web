import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { AlertCircle } from 'lucide-react'
import { hasPlatformPermission } from '@spark/types'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { SearchInput } from '@/components/SearchInput'
import { MobileUsersFilters } from '@/components/MobileUsersFilters'
import { MobileUsersTable } from '@/components/MobileUsersTable'
import { Pagination } from '@/components/Pagination'
import { ApiError, AuthRequiredError } from '@/lib/api'
import { buildQuery, requireSession } from '@/lib/dal'
import { listMobileUsers } from '@/lib/mobile-user-api'
import {
  MOBILE_SEARCH_MIN,
  MOBILE_SIGN_IN_PROVIDERS,
  MOBILE_USER_STATUSES,
} from '@/lib/mobile-user-schema'
import type {
  MobileSignInProvider,
  MobileUserList,
  MobileUserStatus,
} from '@/lib/mobile-user-schema'

const PAGE_SIZE = 20

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; provider?: string; skip?: string }>
}

function parseStatus(value: string | undefined): MobileUserStatus | undefined {
  return MOBILE_USER_STATUSES.find((status) => status === value)
}

function parseProvider(value: string | undefined): MobileSignInProvider | undefined {
  return MOBILE_SIGN_IN_PROVIDERS.find((provider) => provider === value)
}

export default async function AdminMobileUsersPage({ searchParams }: PageProps) {
  const session = await requireSession()
  if (!hasPlatformPermission(session.user.role, 'identity:mobile.read')) {
    redirect('/dashboard')
  }

  const t = await getTranslations('adminMobileUsers')
  const params = await searchParams
  const search = params.search?.trim() ?? ''
  const status = parseStatus(params.status)
  const provider = parseProvider(params.provider)
  const skip = Math.max(0, parseInt(params.skip ?? '0', 10) || 0)

  let users: MobileUserList | null = null
  let loadFailed = false
  try {
    users = await listMobileUsers({
      search: search.length >= MOBILE_SEARCH_MIN ? search : undefined,
      status,
      provider,
      skip,
      take: PAGE_SIZE,
    })
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError && err.status === 403) redirect('/login?error=restricted')
    loadFailed = true
  }

  const buildHref = (nextSkip: number) =>
    buildQuery('/admin/mobile-users', { search, status, provider, skip: nextSkip })

  const hasFilters = Boolean(search || status || provider)

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <div className="table-toolbar">
        <SearchInput param="search" placeholder={t('searchPlaceholder')} />
      </div>
      <div className="table-toolbar table-toolbar--filters">
        <MobileUsersFilters />
      </div>

      {loadFailed ? (
        <p className="form-banner form-banner--error" role="alert">
          <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
          {t('loadError')}
        </p>
      ) : users && users.items.length > 0 ? (
        <>
          <MobileUsersTable items={users.items} />
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
