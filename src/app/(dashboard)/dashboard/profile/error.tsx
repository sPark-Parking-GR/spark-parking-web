'use client'

import { startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, TriangleAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function ProfileError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations('profile')
  const router = useRouter()

  return (
    <div className="pf-page">
      <header className="pf-phead">
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
      </header>
      <div className="pf-card pf-perr pf-rise">
        <div className="pf-state pf-state--err" role="alert">
          <span className="pf-state__ic" aria-hidden="true">
            <TriangleAlert size={26} strokeWidth={1.8} />
          </span>
          <b>{t('loadError.title')}</b>
          <p>{t('loadError.message')}</p>
          <button
            type="button"
            className="pf-btn pf-btn--pri pf-btn--lg"
            onClick={() =>
              startTransition(() => {
                router.refresh()
                reset()
              })
            }
          >
            <RefreshCw size={16} strokeWidth={1.8} aria-hidden="true" />
            {t('loadError.retry')}
          </button>
        </div>
      </div>
    </div>
  )
}
