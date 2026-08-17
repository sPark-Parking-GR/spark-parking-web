import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { AdminInviteForm } from '@/components/AdminInviteForm'
import { AdminInviteTable } from '@/components/AdminInviteTable'
import { hasPlatformPermission } from '@spark/types'
import { requireSession } from '@/lib/dal'
import { listAdminInvitesAction } from '@/lib/admin-invite-actions'

export default async function AdminAdminsPage() {
  const session = await requireSession()
  if (!hasPlatformPermission(session.user.role, 'identity:admin.invite')) {
    redirect('/dashboard')
  }

  const t = await getTranslations('adminInvites')
  const invites = await listAdminInvitesAction()

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <p className="text-secondary">{t('explainer')}</p>
      <AdminInviteForm />
      {invites.length === 0 ? (
        <EmptyState title={t('empty.title')} message={t('empty.message')} />
      ) : (
        <AdminInviteTable items={invites} />
      )}
    </>
  )
}
