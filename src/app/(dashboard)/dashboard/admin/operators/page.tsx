import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { AlertCircle, Ban, Building2, CheckCircle2, Clock } from 'lucide-react'
import { hasPlatformPermission } from '@spark/types'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { StatCard } from '@/components/StatCard'
import { OperatorsTable } from '@/components/OperatorsTable'
import { ApiError, AuthRequiredError } from '@/lib/api'
import { requireSession } from '@/lib/dal'
import { getOperators } from '@/lib/operator-api'
import type { OperatorSummary } from '@/lib/operator-actions'

export default async function AdminOperatorsPage() {
  const session = await requireSession()
  if (!hasPlatformPermission(session.user.role, 'platform:tenant.read')) {
    redirect('/dashboard')
  }
  const canWrite = hasPlatformPermission(session.user.role, 'platform:tenant.write')

  const t = await getTranslations('onboarding')

  let operators: OperatorSummary[] | null = null
  let loadFailed = false
  try {
    operators = await getOperators()
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError && err.status === 403) redirect('/login?error=restricted')
    loadFailed = true
  }

  const counts = {
    verified: operators?.filter((o) => o.status === 'VERIFIED').length ?? 0,
    pending: operators?.filter((o) => o.status === 'PENDING').length ?? 0,
    suspended: operators?.filter((o) => o.status === 'SUSPENDED').length ?? 0,
  }

  return (
    <>
      <PageHeader title={t('operators.title')} description={t('operators.description')} />

      {loadFailed ? (
        <p className="form-banner form-banner--error" role="alert">
          <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
          {t('operators.loadError')}
        </p>
      ) : operators && operators.length > 0 ? (
        <>
          <div className="stat-grid">
            <StatCard
              label={t('operators.stats.total')}
              value={String(operators.length)}
              icon={Building2}
              tone="primary"
              index={0}
            />
            <StatCard
              label={t('operators.stats.verified')}
              value={String(counts.verified)}
              icon={CheckCircle2}
              tone="success"
              index={1}
            />
            <StatCard
              label={t('operators.stats.pending')}
              value={String(counts.pending)}
              icon={Clock}
              tone="warning"
              index={2}
            />
            <StatCard
              label={t('operators.stats.suspended')}
              value={String(counts.suspended)}
              icon={Ban}
              tone="error"
              index={3}
            />
          </div>
          <OperatorsTable items={operators} canWrite={canWrite} />
        </>
      ) : (
        <EmptyState title={t('operators.empty.title')} message={t('operators.empty.message')} />
      )}
    </>
  )
}
