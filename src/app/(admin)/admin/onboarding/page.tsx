import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { InviteForm } from '@/components/InviteForm'
import { InviteTable } from '@/components/InviteTable'
import { requireSession } from '@/lib/dal'
import { listInvitesAction } from '@/lib/invite-actions'

export default async function OnboardingPage() {
  const session = await requireSession()
  if (session.user.role !== 'platform_admin') {
    redirect('/dashboard')
  }

  const t = await getTranslations('onboarding')
  const invites = await listInvitesAction()

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <InviteForm />
      {invites.length === 0 ? (
        <EmptyState title={t('empty.title')} message={t('empty.message')} />
      ) : (
        <InviteTable items={invites} />
      )}
    </>
  )
}
