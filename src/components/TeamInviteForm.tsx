'use client'

import { useActionState, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { inviteMemberAction } from '@/lib/team-actions'
import type { InviteMemberResult } from '@/lib/team-actions'
import { TEAM_MEMBER_ROLES } from '@/lib/team-types'

const INITIAL_STATE: InviteMemberResult = { ok: true, delivered: true }

function SubmitButton({ atSeatLimit }: { atSeatLimit: boolean }) {
  const t = useTranslations('team')
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      className="btn btn--primary"
      disabled={pending || atSeatLimit}
      aria-disabled={atSeatLimit ? true : undefined}
      data-tooltip={atSeatLimit ? t('form.seatLimitMessage') : undefined}
      data-tooltip-pos="bottom"
    >
      {pending ? t('form.sending') : t('form.sendInvite')}
    </button>
  )
}

// The facilities page has always disabled its create button at the plan limit; this form
// let you fill it in and refused at submit instead. Same limit, two different manners.
export function TeamInviteForm({ hasSeatHeadroom = true }: { hasSeatHeadroom?: boolean }) {
  const t = useTranslations('team')
  const tRole = useTranslations('team.roleOptions')
  const formRef = useRef<HTMLFormElement>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const [state, formAction, isPending] = useActionState(
    async (prev: InviteMemberResult, formData: FormData) => {
      const result = await inviteMemberAction(prev, formData)
      if (result.ok) formRef.current?.reset()
      return result
    },
    INITIAL_STATE,
  )

  const isSeatLimit = !state.ok && state.errorKey === 'errors.seatLimitReached'
  // A refusal at submit also means no headroom, even if the page rendered before the last
  // seat went — so the control locks either way.
  const atSeatLimit = !hasSeatHeadroom || isSeatLimit

  return (
    <form ref={formRef} action={formAction} onSubmit={() => setHasSubmitted(true)} noValidate>
      <section className="editor-section card">
        <div className="editor-section__head">
          <h3 className="h-heading">{t('form.heading')}</h3>
        </div>

        {!hasSeatHeadroom && !isSeatLimit ? (
          <p className="form-banner form-banner--warning" role="status">
            <AlertTriangle size={18} strokeWidth={2} aria-hidden="true" />
            <span className="form-banner__body">
              <span>{t('form.seatLimitMessage')}</span>
              <Link href="/dashboard/billing" className="btn btn--sm btn--secondary">
                {t('upgradeCta')}
              </Link>
            </span>
          </p>
        ) : null}
        {hasSubmitted && !isPending && !state.ok && isSeatLimit ? (
          <p className="form-banner form-banner--warning" role="status">
            <AlertTriangle size={18} strokeWidth={2} aria-hidden="true" />
            <span className="form-banner__body">
              <span>{state.detail ?? t('form.seatLimitMessage')}</span>
              <Link href="/dashboard/billing" className="btn btn--sm btn--secondary">
                {t('upgradeCta')}
              </Link>
            </span>
          </p>
        ) : null}
        {hasSubmitted && !isPending && !state.ok && !isSeatLimit ? (
          <p className="form-banner form-banner--error" role="alert">
            <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
            {state.detail ?? t(state.errorKey)}
          </p>
        ) : null}
        {hasSubmitted && !isPending && state.ok && !state.delivered ? (
          <p className="form-banner form-banner--warning" role="alert">
            <AlertTriangle size={18} strokeWidth={2} aria-hidden="true" />
            {t('form.sentNotDelivered')}
          </p>
        ) : null}
        {hasSubmitted && !isPending && state.ok && state.delivered ? (
          <p className="form-banner form-banner--success" role="status">
            <CheckCircle2 size={18} strokeWidth={2} aria-hidden="true" />
            {t('form.sent')}
          </p>
        ) : null}

        <div className="field-grid">
          <label className="field">
            <span className="field__label">{t('form.emailLabel')}</span>
            <input className="input" type="email" name="email" required disabled={isPending} />
          </label>
          <label className="field">
            <span className="field__label">{t('form.roleLabel')}</span>
            <select className="input" name="role" defaultValue="STAFF" disabled={isPending}>
              {TEAM_MEMBER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {tRole(role)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-actions">
          <SubmitButton atSeatLimit={atSeatLimit} />
        </div>
      </section>
    </form>
  )
}
