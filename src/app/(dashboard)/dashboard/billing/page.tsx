import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { CheckCircle2, Info } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { BillingPlanPanel } from '@/components/BillingPlanPanel'
import { BillingPlanCatalog } from '@/components/BillingPlanCatalog'
import { ApiError, AuthRequiredError } from '@/lib/api'
import { requireSession } from '@/lib/dal'
import { getMyOperatorSubscription, listOperatorPlanCatalog } from '@/lib/operator-subscription-api'
import type { MyOperatorSubscription, OperatorPlanSummary } from '@/lib/operator-subscription-api'

interface PageProps {
  searchParams: Promise<{ checkout?: string }>
}

export default async function BillingPage({ searchParams }: PageProps) {
  const session = await requireSession()
  if (session.user.role !== 'operator_admin') {
    redirect('/dashboard')
  }

  const t = await getTranslations('billing')
  const params = await searchParams
  const checkout =
    params.checkout === 'success' || params.checkout === 'cancel' ? params.checkout : null

  let subscription: MyOperatorSubscription
  try {
    subscription = await getMyOperatorSubscription()
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError && err.status === 403) redirect('/login?error=restricted')
    throw err
  }

  let plans: OperatorPlanSummary[] = []
  try {
    plans = await listOperatorPlanCatalog()
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    // A catalog failure is non-fatal — the current-plan panel is this page's primary
    // content, so it costs the upgrade section rather than the whole page.
  }

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      {checkout === 'success' ? (
        <p className="form-banner form-banner--success" role="status">
          <CheckCircle2 size={18} strokeWidth={2} aria-hidden="true" />
          {t('checkoutReturn.success')}
        </p>
      ) : null}

      {checkout === 'cancel' ? (
        <p className="form-banner form-banner--info" role="status">
          <Info size={18} strokeWidth={2} aria-hidden="true" />
          {t('checkoutReturn.cancelled')}
        </p>
      ) : null}

      <BillingPlanPanel subscription={subscription} />

      <h2 className="h-heading">{t('plans.heading')}</h2>
      <p className="text-secondary">{t('plans.subtitle')}</p>

      {plans.length === 0 ? (
        <EmptyState title={t('plans.empty.title')} message={t('plans.empty.message')} />
      ) : (
        <BillingPlanCatalog plans={plans} currentPlanCode={subscription.planCode} />
      )}
    </>
  )
}
