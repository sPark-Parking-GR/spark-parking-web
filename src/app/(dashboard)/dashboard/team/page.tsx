import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { TeamInviteForm } from '@/components/TeamInviteForm'
import { TeamMembersTable } from '@/components/TeamMembersTable'
import { TeamInvitesTable } from '@/components/TeamInvitesTable'
import { ApiError, AuthRequiredError } from '@/lib/api'
import { requireSession } from '@/lib/dal'
import { getMyOperatorId, getOperatorMembers, listMemberInvites } from '@/lib/team-api'
import type { TeamMemberInvite, TeamMemberSummary } from '@/lib/team-types'

export default async function TeamPage() {
  const session = await requireSession()
  if (session.user.role !== 'operator_admin') {
    redirect('/dashboard')
  }

  const t = await getTranslations('team')

  let invites: TeamMemberInvite[] = []
  try {
    invites = await listMemberInvites()
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError && err.status === 403) redirect('/login?error=restricted')
    // A load failure here is non-fatal — the invites list is secondary to the member
    // table below, so the page still renders with an empty pending-invites section.
  }

  const operatorId = await getMyOperatorId(invites)

  if (!operatorId) {
    return (
      <>
        <PageHeader title={t('title')} description={t('description')} />
        <EmptyState title={t('operatorMissing.title')} message={t('operatorMissing.message')} />
      </>
    )
  }

  let members: TeamMemberSummary[] = []
  try {
    members = await getOperatorMembers(operatorId)
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError && (err.status === 403 || err.status === 404)) {
      redirect('/login?error=restricted')
    }
    throw err
  }

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <p className="text-secondary">{t('explainer')}</p>

      <TeamInviteForm />

      {members.length === 0 ? (
        <EmptyState title={t('empty.title')} message={t('empty.message')} />
      ) : (
        <TeamMembersTable
          operatorId={operatorId}
          members={members}
          currentUserId={session.user.id}
        />
      )}

      <h3 className="h-heading">{t('invites.title')}</h3>
      {invites.length === 0 ? (
        <p className="text-secondary">{t('invites.empty')}</p>
      ) : (
        <TeamInvitesTable items={invites} />
      )}
    </>
  )
}
