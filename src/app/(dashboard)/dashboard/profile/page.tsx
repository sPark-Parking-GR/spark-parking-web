import { getTranslations } from 'next-intl/server'
import { ChangePasswordForm } from '@/components/ChangePasswordForm'
import { PageHeader } from '@/components/PageHeader'
import { ProfileForgotPasswordSection } from '@/components/ProfileForgotPasswordSection'
import { ProfileForm } from '@/components/ProfileForm'
import { requireSession } from '@/lib/dal'

/**
 * Reachable from the identity chip in the topbar rather than the sidebar: it is a personal
 * setting, not part of running a car park, and the sidebar is the operator's working set.
 *
 * Open to every dashboard role. Correcting your own name is not a privilege — and the
 * accounts most likely to need it are the operator admins onboarded before the accept form
 * asked for a personal name, who currently carry their company's name as their own.
 *
 * The two password sections sit in that order on purpose. Changing a password you know is
 * the ordinary case and asks for the current one first; the reset link below it is the
 * fallback for the person who is signed in on this device but cannot produce it — the only
 * case the form above cannot serve. Neither section takes an email address: both act on the
 * account the session already resolved.
 */
export default async function ProfilePage() {
  const session = await requireSession()
  const t = await getTranslations('profile')

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <ProfileForm email={session.user.email} initialName={session.user.displayName ?? ''} />
      <ChangePasswordForm />
      <ProfileForgotPasswordSection />
    </>
  )
}
