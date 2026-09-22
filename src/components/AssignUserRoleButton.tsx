'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { assignUserRoleAction } from '@/lib/identity-actions'
import { ASSIGNABLE_IDENTITY_ROLES } from '@/lib/identity-types'
import type { AssignableIdentityRole, IdentityRole } from '@/lib/identity-types'

interface Props {
  id: string
  email: string
  // The full account role, which may be an operator-derived role (OPERATOR_STAFF /
  // OPERATOR_ADMIN) that this form cannot select directly — those fall back to the
  // ASSIGNABLE_IDENTITY_ROLES member that already resolves to them (USER), since granting
  // no platform role is what keeps the operator-derived role in place server-side.
  currentRole: IdentityRole
}

function toAssignable(role: IdentityRole): AssignableIdentityRole {
  return role === 'PLATFORM_ADMIN' || role === 'SUPER_ADMIN' ? role : 'USER'
}

export function AssignUserRoleButton({ id, email, currentRole }: Props) {
  const t = useTranslations('adminUsers.detail.role')
  const tRole = useTranslations('adminUsers.role')
  const tUsers = useTranslations('adminUsers')
  const tCommon = useTranslations('adminLifecycle')
  const router = useRouter()
  const initialRole = toAssignable(currentRole)
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<AssignableIdentityRole>(initialRole)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const reasonInvalid = reason.trim().length < 3

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const result = await assignUserRoleAction(id, role, reason.trim())
      if (!result.ok) {
        setError(result.detail ?? tUsers(result.errorKey))
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <button
        type="button"
        className="btn btn--sm btn--secondary"
        onClick={() => {
          setRole(initialRole)
          setReason('')
          setError(null)
          setOpen(true)
        }}
      >
        {t('trigger')}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t('modalTitle')}>
        <p className="modal__text">{t('modalText', { email })}</p>

        <label className="field">
          <span className="field__label">{t('roleLabel')}</span>
          <select
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value as AssignableIdentityRole)}
            disabled={pending}
          >
            {ASSIGNABLE_IDENTITY_ROLES.map((r) => (
              <option key={r} value={r}>
                {tRole(r)}
              </option>
            ))}
          </select>
        </label>

        <div className="field">
          <span className="field__label">{t('reasonLabel')}</span>
          <textarea
            className="input input--textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={tCommon('reasonPlaceholder')}
            disabled={pending}
          />
          {reasonInvalid ? (
            <span className="field__error">{tCommon('validation.reasonRequired')}</span>
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
            {tCommon('cancel')}
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={pending || reasonInvalid || role === initialRole}
            onClick={submit}
          >
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
