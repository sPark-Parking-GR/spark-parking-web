'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'
import { ORG_PERMISSIONS, isStaffGrantableScope } from '@spark/types'
import type { OrgPermission } from '@spark/types'

const STAFF_EDITABLE_PERMISSIONS = ORG_PERMISSIONS.filter(isStaffGrantableScope)
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { setMemberScopesAction } from '@/lib/team-actions'
import { SCOPE_I18N_KEY } from '@/lib/team-types'

interface Props {
  operatorId: string
  userId: string
  email: string
  scopes: OrgPermission[]
}

export function TeamMemberScopesButton({ operatorId, userId, email, scopes }: Props) {
  const tCommon = useTranslations('team')
  const t = useTranslations('team.scopesEditor')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<OrgPermission>>(() => new Set(scopes))
  const [error, setError] = useState<{ message: string; isFeatureRequired: boolean } | null>(null)
  const [pending, startTransition] = useTransition()

  function toggle(scope: OrgPermission) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(scope)) next.delete(scope)
      else next.add(scope)
      return next
    })
  }

  function openModal() {
    setSelected(new Set(scopes))
    setError(null)
    setOpen(true)
  }

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const result = await setMemberScopesAction(operatorId, userId, Array.from(selected))
      if (!result.ok) {
        setError({
          message: result.detail ?? tCommon(result.errorKey),
          isFeatureRequired: result.errorKey === 'errors.featureRequired',
        })
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <button type="button" className="btn btn--sm btn--secondary" onClick={openModal}>
        {t('trigger')}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t('modalTitle', { email })} wide>
        <p className="form-banner form-banner--warning" role="status">
          <AlertTriangle size={16} strokeWidth={2} aria-hidden="true" />
          {t('signOutWarning', { email })}
        </p>

        {error ? (
          <p className="form-banner form-banner--error" role="alert">
            {error.isFeatureRequired ? (
              <span className="form-banner__body">
                <span>{error.message}</span>
                <Link href="/dashboard/billing" className="btn btn--sm btn--secondary">
                  {tCommon('upgradeCta')}
                </Link>
              </span>
            ) : (
              error.message
            )}
          </p>
        ) : null}

        <div className="assign-rows">
          {STAFF_EDITABLE_PERMISSIONS.map((scope) => {
            const key = SCOPE_I18N_KEY[scope]
            return (
              <label key={scope} className="assign-row checkbox-label">
                <input
                  type="checkbox"
                  checked={selected.has(scope)}
                  onChange={() => toggle(scope)}
                  disabled={pending}
                />
                <span className="assign-row__field">
                  <span className="field__label">{t(`scopes.${key}.label`)}</span>
                  <span className="text-secondary">{t(`scopes.${key}.description`)}</span>
                </span>
              </label>
            )
          })}
        </div>

        <div className="modal__footer">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            {t('cancel')}
          </button>
          <button type="button" className="btn btn--primary" disabled={pending} onClick={submit}>
            {pending ? (
              <>
                <Spinner size={15} />
                {t('confirming')}
              </>
            ) : (
              t('confirm')
            )}
          </button>
        </div>
      </Modal>
    </>
  )
}
