'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import type { CSSProperties, RefObject } from 'react'
import { CircleAlert, Check, LockKeyhole, Mail, TriangleAlert, UserRound } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { FloatingInput } from '@/components/FloatingInput'
import { Spinner } from '@/components/Spinner'
import { updateProfileAction } from '@/lib/profile-actions'
import type { ProfileActionResult } from '@/lib/profile-actions'
import { DETAILS_ID } from './IdentityCard'

// Mirrors profileSchema in profile-actions.ts. Counted after trim, as the server counts it.
export const NAME_MAX = 120
const SAVED_FLASH_MS = 1600
const INITIAL_STATE: ProfileActionResult = { ok: true }

interface DetailsCardProps {
  email: string
  savedName: string
  draft: string
  onDraftChange: (value: string) => void
  onSaved: (name: string) => void
  nameRef: RefObject<HTMLInputElement | null>
}

export function DetailsCard({
  email,
  savedName,
  draft,
  onDraftChange,
  onSaved,
  nameRef,
}: DetailsCardProps) {
  const t = useTranslations('profile')
  const formRef = useRef<HTMLFormElement>(null)
  const submitted = useRef('')
  const [state, formAction, pending] = useActionState(updateProfileAction, INITIAL_STATE)
  const [flash, setFlash] = useState(false)
  // The error note belongs to the attempt that produced it; typing again retires it.
  const [dismissed, setDismissed] = useState<ProfileActionResult | null>(null)

  const trimmed = draft.trim()
  const dirty = trimmed !== savedName.trim()
  const tooLong = trimmed.length > NAME_MAX
  const canSave = dirty && !tooLong && !pending
  const saveError = state !== INITIAL_STATE && !state.ok && dismissed !== state ? state : null

  useEffect(() => {
    if (state === INITIAL_STATE || !state.ok) return
    onSaved(submitted.current)
    setFlash(true)
    const timer = setTimeout(() => setFlash(false), SAVED_FLASH_MS)
    return () => clearTimeout(timer)
  }, [state, onSaved])

  const describedBy = tooLong ? 'pf-name-error pf-name-help' : 'pf-name-help'

  return (
    <section
      className="pf-card pf-sec pf-rise"
      id={DETAILS_ID}
      style={{ '--i': 1 } as CSSProperties}
      aria-labelledby="pf-details-title"
    >
      <div className="pf-chead">
        <span className="pf-chip pf-chip--blue" aria-hidden="true">
          <UserRound size={20} strokeWidth={1.8} />
        </span>
        <div className="pf-chead__grow">
          <h2 id="pf-details-title" tabIndex={-1}>
            {t('heading')}
          </h2>
          <p>{t('detailsSubtitle')}</p>
        </div>
      </div>

      <form
        ref={formRef}
        action={formAction}
        noValidate
        onSubmit={(event) => {
          if (!canSave) {
            event.preventDefault()
            return
          }
          submitted.current = trimmed
        }}
      >
        <div className="pf-body">
          <div className="pf-grid2">
            <div className="pf-fwrap">
              <FloatingInput
                ref={nameRef}
                id="pf-name"
                name="displayName"
                label={t('nameLabel')}
                icon={<UserRound size={18} strokeWidth={1.8} />}
                type="text"
                autoComplete="name"
                value={draft}
                readOnly={pending}
                aria-invalid={tooLong ? true : undefined}
                aria-describedby={describedBy}
                className={tooLong ? 'pf-input--bad' : undefined}
                onChange={(event) => {
                  onDraftChange(event.target.value)
                  setDismissed(state)
                }}
              />
              {tooLong ? (
                <p className="pf-msg pf-msg--err" id="pf-name-error">
                  <CircleAlert size={16} strokeWidth={1.8} aria-hidden="true" />
                  {t('errors.nameTooLong')}
                  <span className="pf-counter">
                    {trimmed.length}/{NAME_MAX}
                  </span>
                </p>
              ) : null}
              <p className="pf-help" id="pf-name-help">
                {t('nameHint', { email })}
              </p>
            </div>

            <div className="pf-fwrap">
              <FloatingInput
                id="pf-email"
                label={t('emailLabel')}
                icon={<Mail size={18} strokeWidth={1.8} />}
                type="email"
                value={email}
                readOnly
                aria-readonly="true"
                className="pf-input--ro"
                trailing={
                  <span
                    className="pf-lock"
                    tabIndex={0}
                    role="img"
                    aria-label={t('emailLocked')}
                    data-tooltip={t('emailLocked')}
                    data-tooltip-pos="bottom"
                  >
                    <LockKeyhole size={18} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                }
              />
            </div>
          </div>

          {saveError && !saveError.ok ? (
            <div className="pf-note pf-note--bad" role="alert">
              <TriangleAlert size={18} strokeWidth={1.8} aria-hidden="true" />
              <span>
                {saveError.detail ?? t('saveFailed')}
                <button type="button" onClick={() => formRef.current?.requestSubmit()}>
                  {t('retry')}
                </button>
              </span>
            </div>
          ) : null}
        </div>

        <div className={`pf-foot${dirty ? ' pf-foot--dirty' : ''}`}>
          <span className="pf-stat" role="status">
            {dirty ? (
              <>
                <i className="pf-stat__dot" aria-hidden="true" />
                <span>{t('unsaved')}</span>
              </>
            ) : (
              <>
                <Check size={16} strokeWidth={2} aria-hidden="true" />
                <span>{t('allSaved')}</span>
              </>
            )}
          </span>
          <div className="pf-btns">
            {dirty ? (
              <button
                type="button"
                className="pf-btn pf-btn--lg"
                disabled={pending}
                onClick={() => {
                  onDraftChange(savedName)
                  setDismissed(state)
                }}
              >
                {t('discard')}
              </button>
            ) : null}
            <button
              type="submit"
              className={`pf-btn pf-btn--pri pf-btn--lg${flash && !dirty ? ' pf-btn--ok' : ''}`}
              disabled={!canSave}
              aria-busy={pending}
            >
              {pending ? (
                <Spinner size={16} />
              ) : (
                <Check size={16} strokeWidth={2} aria-hidden="true" />
              )}
              {pending ? t('saving') : flash && !dirty ? t('savedShort') : t('save')}
            </button>
          </div>
        </div>
      </form>
    </section>
  )
}
