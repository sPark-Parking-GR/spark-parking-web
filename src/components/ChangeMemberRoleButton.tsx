'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { changeOperatorMemberRoleAction } from '@/lib/operator-member-actions'
import type { OperatorMemberRole } from '@/lib/operator-member-actions'

interface Props {
  operatorId: string
  userId: string
  email: string
  currentRole: OperatorMemberRole
}

export function ChangeMemberRoleButton({ operatorId, userId, email, currentRole }: Props) {
  const t = useTranslations('onboarding.detail.members.changeRole')
  const tRole = useTranslations('onboarding.detail.members.roleOptions')
  const tCommon = useTranslations('adminLifecycle')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<OperatorMemberRole>(currentRole)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const result = await changeOperatorMemberRoleAction(operatorId, userId, role)
      if (!result.ok) {
        setError(result.detail ?? tCommon(result.errorKey))
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
          setRole(currentRole)
          setError(null)
          setOpen(true)
        }}
      >
        {t('trigger')}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t('modalTitle', { email })}>
        <label className="field">
          <span className="field__label">{t('roleLabel')}</span>
          <select
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value as OperatorMemberRole)}
            disabled={pending}
          >
            <option value="STAFF">{tRole('STAFF')}</option>
            <option value="ADMIN">{tRole('ADMIN')}</option>
          </select>
        </label>

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
            disabled={pending || role === currentRole}
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
