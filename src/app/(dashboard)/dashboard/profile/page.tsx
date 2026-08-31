import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/PageHeader'
import { ProfileForm } from '@/components/ProfileForm'
import { requireSession } from '@/lib/dal'

/**
 * Reachable from the identity chip in the topbar rather than the sidebar: it is a personal
 * setting, not part of running a car park, and the sidebar is the operator's working set.
 *
 * Open to every dashboard role. Correcting your own name is not a privilege — and the
 * accounts most likely to need it are the operator admins onboarded before the accept form
 * asked for a personal name, who currently carry their company's name as their own.
 */
export default async function ProfilePage() {
  const session = await requireSession()
  const t = await getTranslations('profile')

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <ProfileForm email={session.user.email} initialName={session.user.displayName ?? ''} />
    </>
  )
}
