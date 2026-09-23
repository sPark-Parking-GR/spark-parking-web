'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { changeMemberRoleAction } from '@/lib/team-actions'
import { TEAM_MEMBER_ROLES } from '@/lib/team-types'
import type { TeamMemberRole } from '@/lib/team-types'

interface Props {
  operatorId: string
  userId: string
  email: string
  currentRole: TeamMemberRole
}

export function TeamChangeRoleButton({ operatorId, userId, email, currentRole }: Props) {
  const t = useTranslations('team')
  const tRole = useTranslations('team.roleOptions')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<TeamMemberRole>(currentRole)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const result = await changeMemberRoleAction(operatorId, userId, role)
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
      <button
        type="button"
        className="btn btn--sm btn--secondary"
        onClick={() => {
          setRole(currentRole)
          setError(null)
          setOpen(true)
        }}
      >
        {t('changeRole.trigger')}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('changeRole.modalTitle', { email })}
      >
        <label className="field">
          <span className="field__label">{t('changeRole.roleLabel')}</span>
          <select
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value as TeamMemberRole)}
            disabled={pending}
          >
            {TEAM_MEMBER_ROLES.map((option) => (
              <option key={option} value={option}>
                {tRole(option)}
              </option>
            ))}
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
            {t('cancel')}
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
                {t('changeRole.confirming')}
              </>
            ) : (
              t('changeRole.confirm')
            )}
          </button>
        </div>
      </Modal>
    </>
  )
}
