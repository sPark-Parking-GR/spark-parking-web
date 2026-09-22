import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { AlertCircle, ShieldCheck } from 'lucide-react'
import { hasPlatformPermission } from '@spark/types'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { ApprovalsTable } from '@/components/ApprovalsTable'
import { ApiError, AuthRequiredError } from '@/lib/api'
import { requireSession } from '@/lib/dal'
import { listApprovals } from '@/lib/lifecycle-api'
import type { LifecycleApprovalListResponse } from '@/lib/lifecycle-api'

export default async function ApprovalsPage() {
  const session = await requireSession()
  if (!hasPlatformPermission(session.user.role, 'platform:tenant.purge')) {
    redirect('/dashboard')
  }

  const t = await getTranslations('adminLifecycle.approvals')

  let approvals: LifecycleApprovalListResponse | null = null
  let loadFailed = false
  try {
    approvals = await listApprovals()
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError && err.status === 403) redirect('/login?error=restricted')
    loadFailed = true
  }

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      {loadFailed ? (
        <p className="form-banner form-banner--error" role="alert">
          <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
          {t('loadError')}
        </p>
      ) : approvals && approvals.items.length > 0 ? (
        <ApprovalsTable items={approvals.items} currentUserId={session.user.id} />
      ) : (
        <EmptyState title={t('empty.title')} message={t('empty.message')} icon={ShieldCheck} />
      )}
    </>
  )
}
