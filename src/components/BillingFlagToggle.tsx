'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { setBillingEnabledAction } from '@/lib/system-flags-actions'

export function BillingFlagToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const t = useTranslations('systemSettings')
  const router = useRouter()
  const [enabled, setEnabled] = useState(initialEnabled)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const toggle = () => {
    const next = !enabled
    setError(null)
    startTransition(async () => {
      const res = await setBillingEnabledAction(next)
      if (!res.ok) {
        setError(t(res.errorKey))
        return
      }
      setEnabled(next)
      router.refresh()
    })
  }

  return (
    <div className="panel-card">
      <div className="panel-card__header">
        <div>
          <h2 className="panel-card__title">{t('billing.label')}</h2>
          <p className="panel-card__subtitle text-secondary">{t('billing.description')}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={t('billing.label')}
          disabled={pending}
          onClick={toggle}
          className="publish-switch"
        >
          <span className="publish-switch__knob" />
        </button>
      </div>
      <div className="panel-card__body">
        <p className="text-secondary">{enabled ? t('billing.on') : t('billing.off')}</p>
        {error ? (
          <p className="form-banner form-banner--error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}
