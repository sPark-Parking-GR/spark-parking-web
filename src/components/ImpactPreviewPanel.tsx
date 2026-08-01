'use client'

import { AlertTriangle, Info, ShieldAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Spinner } from './Spinner'
import type { LifecycleImpactPreview } from '@/lib/lifecycle-api'

interface Props {
  loading: boolean
  error: boolean
  preview: LifecycleImpactPreview | null
  acknowledged: boolean
  onAcknowledgeChange: (value: boolean) => void
}

export function ImpactPreviewPanel({
  loading,
  error,
  preview,
  acknowledged,
  onAcknowledgeChange,
}: Props) {
  const t = useTranslations('adminLifecycle.impact')

  if (loading) {
    return (
      <p className="form-banner" role="status">
        <Spinner size={15} />
        {t('loading')}
      </p>
    )
  }

  if (error || !preview) {
    return (
      <p className="form-banner form-banner--error" role="alert">
        {t('loadError')}
      </p>
    )
  }

  const showAcknowledge = preview.requiresForce && preview.warnings.length > 0
  const hasContent =
    preview.blockers.length > 0 || preview.warnings.length > 0 || preview.effects.length > 0

  return (
    <>
      {preview.blockers.length > 0 ? (
        <div className="form-banner form-banner--error" role="alert">
          <ShieldAlert size={18} strokeWidth={2} aria-hidden="true" />
          <div className="form-banner__body">
            <strong>{t('blockersTitle')}</strong>
            <ul>
              {preview.blockers.map((blocker) => (
                <li key={blocker.code}>
                  {blocker.message} — {blocker.remedy}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {preview.warnings.length > 0 ? (
        <div className="form-banner form-banner--warning" role="alert">
          <AlertTriangle size={18} strokeWidth={2} aria-hidden="true" />
          <div className="form-banner__body">
            <strong>{t('warningsTitle')}</strong>
            <ul>
              {preview.warnings.map((warning) => (
                <li key={warning.code}>
                  {warning.message} ({warning.count})
                </li>
              ))}
            </ul>
            {showAcknowledge ? (
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => onAcknowledgeChange(e.target.checked)}
                />
                {t('acknowledge')}
              </label>
            ) : null}
          </div>
        </div>
      ) : null}

      {preview.effects.length > 0 ? (
        <div className="form-banner form-banner--info" role="status">
          <Info size={18} strokeWidth={2} aria-hidden="true" />
          <div className="form-banner__body">
            <strong>{t('effectsTitle')}</strong>
            <ul>
              {preview.effects.map((effect, index) => (
                <li key={`${effect.entity}-${effect.action}-${index}`}>
                  {effect.count} × {effect.entity} — {effect.action}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {!hasContent ? (
        <p className="form-banner form-banner--info" role="status">
          <Info size={18} strokeWidth={2} aria-hidden="true" />
          {t('noImpact')}
        </p>
      ) : null}
    </>
  )
}
