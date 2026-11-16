import { getTranslations } from 'next-intl/server'
import { LoadingFlag } from '@/components/profile/LoadingFlag'
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton'

export default async function Loading() {
  const t = await getTranslations('profile')

  return (
    <div className="pf-page" aria-busy="true">
      <LoadingFlag />
      <header className="pf-phead">
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
      </header>
      <span className="pf-sr" role="status">
        {t('loading')}
      </span>
      <ProfileSkeleton />
    </div>
  )
}
