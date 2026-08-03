'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { ImpactPreviewPanel } from './ImpactPreviewPanel'
import {
  archiveResourceAction,
  getImpactPreviewAction,
  purgeResourceAction,
  restoreResourceAction,
  tombstoneResourceAction,
} from '@/lib/lifecycle-actions'
import type { LifecycleImpactPreview, LifecycleResourceType } from '@/lib/lifecycle-api'

export type LifecycleActionKind = 'archive' | 'restore' | 'tombstone' | 'purge'

interface Props {
  resourceType: LifecycleResourceType
  resourceId: string
  resourceLabel: string
  action: LifecycleActionKind
  triggerClassName?: string
  icon?: ReactNode
  iconOnly?: boolean
}

const ICON_TRIGGER_CLASS: Record<LifecycleActionKind, string> = {
  archive: 'btn btn--icon btn--ghost',
  restore: 'btn btn--icon btn--ghost-primary',
  tombstone: 'btn btn--icon btn--ghost-danger',
  purge: 'btn btn--icon btn--ghost-danger',
}

const REASON_REQUIRED: Record<LifecycleActionKind, boolean> = {
  archive: true,
  restore: false,
  tombstone: true,
  purge: true,
}

const CONFIRM_CLASS: Record<LifecycleActionKind, string> = {
  archive: 'btn btn--danger-solid',
  restore: 'btn btn--primary',
  tombstone: 'btn btn--danger-solid',
  purge: 'btn btn--danger-solid',
}

// Restore is deliberately not gated on an impact preview — it is a reversal, not a
// destruction, and the API exposes no /impact?action=restore variant. Its own conflicts
// (operator facility cap, default-plan slot) surface as a 409 from the restore call itself.
const HAS_IMPACT_PREVIEW: Record<LifecycleActionKind, boolean> = {
  archive: true,
  restore: false,
  tombstone: true,
  purge: true,
}

export function LifecycleActionButton({
  resourceType,
  resourceId,
  resourceLabel,
  action,
  triggerClassName,
  icon,
  iconOnly,
}: Props) {
  const t = useTranslations('adminLifecycle')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<LifecycleImpactPreview | null>(null)
  const [previewError, setPreviewError] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [reason, setReason] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingApproval, setPendingApproval] = useState(false)
  const [pending, startTransition] = useTransition()

  const showPreview = HAS_IMPACT_PREVIEW[action]

  useEffect(() => {
    if (!open) return
    setPreview(null)
    setPreviewError(false)
    setAcknowledged(false)
    setReason('')
    setError(null)
    setPendingApproval(false)

    if (!showPreview) return
    setLoadingPreview(true)
    getImpactPreviewAction(resourceType, resourceId, action as 'archive' | 'tombstone' | 'purge')
      .then((res) => {
        if (res.ok) setPreview(res.data)
        else setPreviewError(true)
      })
      .catch(() => setPreviewError(true))
      .finally(() => setLoadingPreview(false))
  }, [open, resourceType, resourceId, action, showPreview])

  const reasonRequired = REASON_REQUIRED[action]
  const reasonInvalid = reasonRequired && reason.trim().length === 0
  const hasBlockers = Boolean(preview && preview.blockers.length > 0)
  const needsAcknowledgement = Boolean(
    preview?.requiresForce && (preview?.warnings.length ?? 0) > 0,
  )
  const confirmDisabled =
    pending ||
    reasonInvalid ||
    (showPreview &&
      (loadingPreview || previewError || hasBlockers || (needsAcknowledgement && !acknowledged)))

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const trimmedReason = reason.trim()

      if (action === 'purge') {
        const result = await purgeResourceAction(resourceType, resourceId, trimmedReason)
        if (!result.ok) {
          setError(result.detail ?? t(result.errorKey))
          return
        }
        setPendingApproval(true)
        router.refresh()
        return
      }

      const result =
        action === 'archive'
          ? await archiveResourceAction(resourceType, resourceId, trimmedReason)
          : action === 'restore'
            ? await restoreResourceAction(resourceType, resourceId, trimmedReason || undefined)
            : await tombstoneResourceAction(resourceType, resourceId, trimmedReason)

      if (!result.ok) {
        setError(result.detail ?? t(result.errorKey))
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      {iconOnly && icon ? (
        <button
          type="button"
          className={triggerClassName ?? ICON_TRIGGER_CLASS[action]}
          onClick={() => setOpen(true)}
          aria-label={t(`action.${action}.trigger`)}
          data-tooltip={t(`action.${action}.trigger`)}
          data-tooltip-pos="bottom"
        >
          {icon}
        </button>
      ) : (
        <button
          type="button"
          className={triggerClassName ?? 'btn btn--sm btn--secondary'}
          onClick={() => setOpen(true)}
        >
          {t(`action.${action}.trigger`)}
        </button>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t(`action.${action}.modalTitle`, { resource: resourceLabel })}
      >
        {pendingApproval ? (
          <>
            <p className="form-banner form-banner--success" role="status">
              {t('action.purge.pendingApproval')}
            </p>
            <div className="modal__footer">
              <button type="button" className="btn btn--secondary" onClick={() => setOpen(false)}>
                {t('close')}
              </button>
            </div>
          </>
        ) : (
          <>
            {showPreview ? (
              <ImpactPreviewPanel
                loading={loadingPreview}
                error={previewError}
                preview={preview}
                acknowledged={acknowledged}
                onAcknowledgeChange={setAcknowledged}
              />
            ) : null}

            <div className="field">
              <span className="field__label">
                {reasonRequired ? t('reasonLabel') : t('reasonOptionalLabel')}
              </span>
              <textarea
                className="input input--textarea"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('reasonPlaceholder')}
                disabled={pending}
              />
              {reasonInvalid ? (
                <span className="field__error">{t('validation.reasonRequired')}</span>
              ) : null}
            </div>

            {error ? (
              <p className="form-banner form-banner--error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="modal__footer">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                className={CONFIRM_CLASS[action]}
                disabled={confirmDisabled}
                onClick={submit}
              >
                {pending ? (
                  <>
                    <Spinner size={15} />
                    {t(`action.${action}.confirming`)}
                  </>
                ) : (
                  t(`action.${action}.confirm`)
                )}
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
