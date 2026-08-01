import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { AlertCircle } from 'lucide-react'
import { hasPlatformPermission } from '@spark/types'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
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

  return (
    <>
      <PageHeader title={t('operators.title')} description={t('operators.description')} />

      {loadFailed ? (
        <p className="form-banner form-banner--error" role="alert">
          <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
          {t('operators.loadError')}
        </p>
      ) : operators && operators.length > 0 ? (
        <OperatorsTable items={operators} canWrite={canWrite} />
      ) : (
        <EmptyState title={t('operators.empty.title')} message={t('operators.empty.message')} />
      )}
    </>
  )
}
