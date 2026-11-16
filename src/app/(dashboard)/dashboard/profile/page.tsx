import { getTranslations } from 'next-intl/server'
import { ProfileView } from '@/components/profile/ProfileView'
import { requireSession } from '@/lib/dal'
import { roleLabelFor } from '@/lib/shell-account-server'

/**
 * Reachable from the identity chip in the topbar rather than the sidebar: it is a personal
 * setting, not part of running a car park, and the sidebar is the operator's working set.
 *
 * Open to every dashboard role. Correcting your own name is not a privilege - and the
 * accounts most likely to need it are the operator admins onboarded before the accept form
 * asked for a personal name, who currently carry their company's name as their own.
 *
 * The password card and the reset-link panel sit in that order on purpose. Changing a
 * password you know is the ordinary case and asks for the current one first; the reset link
 * is the fallback for the person who is signed in on this device but cannot produce it.
 * Neither takes an email address: both act on the account the session already resolved.
 */
export default async function ProfilePage() {
  const session = await requireSession()
  const t = await getTranslations('profile')
  const roleLabel = await roleLabelFor(session.user.role)

  return (
    <div className="pf-page">
      <header className="pf-phead">
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
      </header>
      <ProfileView
        email={session.user.email}
        initialName={session.user.displayName ?? ''}
        roleLabel={roleLabel}
      />
    </div>
  )
}
