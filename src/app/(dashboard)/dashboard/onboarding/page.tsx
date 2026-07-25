import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { InviteForm } from '@/components/InviteForm'
import { InviteTable } from '@/components/InviteTable'
import { OperatorsTable } from '@/components/OperatorsTable'
import { requireSession } from '@/lib/dal'
import { listInvitesAction } from '@/lib/invite-actions'
import { listOperatorsAction } from '@/lib/operator-actions'

export default async function OnboardingPage() {
  const session = await requireSession()
  if (session.user.role !== 'platform_admin') {
    redirect('/dashboard')
  }

  const t = await getTranslations('onboarding')
  const [invites, operators] = await Promise.all([listInvitesAction(), listOperatorsAction()])

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <InviteForm />
      {invites.length === 0 ? (
        <EmptyState title={t('empty.title')} message={t('empty.message')} />
      ) : (
        <InviteTable items={invites} />
      )}

      <PageHeader title={t('operators.title')} description={t('operators.description')} />
      {operators.length === 0 ? (
        <EmptyState title={t('operators.empty.title')} message={t('operators.empty.message')} />
      ) : (
        <OperatorsTable items={operators} />
      )}
    </>
  )
}
