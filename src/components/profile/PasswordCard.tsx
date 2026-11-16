'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import type { CSSProperties, RefObject } from 'react'
import { Clock, Mail, MailCheck, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { PasswordField } from '@/components/PasswordField'
import { Spinner } from '@/components/Spinner'
import { changePasswordAction, requestOwnPasswordResetAction } from '@/lib/profile-actions'
import type { ChangePasswordActionResult } from '@/lib/profile-actions'
import { SECURITY_ID } from './IdentityCard'
import { RESEND_COOLDOWN_MS, ResetLinkPanel } from './ResetLinkPanel'
import { Stepper } from './Stepper'
import { formatCountdown, useCountdown } from './useCountdown'

const INITIAL_STATE: ChangePasswordActionResult = { ok: true }

type Step = 1 | 2
type Direction = 'forward' | 'back' | null

interface PasswordCardProps {
  email: string
  onToast: (text: string) => void
}

/**
 * Steps one and two of the password change live here, in client state. Step three is the page
 * the emailed link opens (/reset-password/[token]) - it cannot happen in this card because the
 * password only moves once the mailbox has been proved.
 */
export function PasswordCard({ email, onToast }: PasswordCardProps) {
  const t = useTranslations('profile')
  const [step, setStep] = useState<Step>(1)
  const [direction, setDirection] = useState<Direction>(null)
  const [resendAt, setResendAt] = useState(0)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const moved = useRef(false)

  const go = (next: Step) => {
    setDirection(next > step ? 'forward' : 'back')
    setStep(next)
    moved.current = true
  }

  useEffect(() => {
    if (moved.current) headingRef.current?.focus({ preventScroll: true })
  }, [step])

  const resent = () => {
    setResendAt(Date.now() + RESEND_COOLDOWN_MS)
    onToast(t('changePassword.resentToast'))
  }

  return (
    <section
      className="pf-card pf-sec pf-rise"
      id={SECURITY_ID}
      style={{ '--i': 2 } as CSSProperties}
      aria-labelledby="pf-security-title"
    >
      <div className="pf-chead">
        <span className="pf-chip pf-chip--cyan" aria-hidden="true">
          <ShieldCheck size={20} strokeWidth={1.8} />
        </span>
        <div className="pf-chead__grow">
          <h2 id="pf-security-title" tabIndex={-1}>
            {t('security.heading')}
          </h2>
          <p>{t('security.description')}</p>
        </div>
      </div>

      <div className="pf-body">
        <Stepper current={step} />
        <div className="pf-panels">
          {step === 1 ? (
            <ConfirmStep
              key="confirm"
              email={email}
              direction={direction}
              headingRef={headingRef}
              onSent={() => {
                setResendAt(Date.now() + RESEND_COOLDOWN_MS)
                go(2)
              }}
            />
          ) : (
            <CheckEmailStep
              key="check"
              email={email}
              direction={direction}
              headingRef={headingRef}
              resendAt={resendAt}
              onResent={resent}
              onStartOver={() => go(1)}
            />
          )}
        </div>
        <ResetLinkPanel email={email} onResent={() => onToast(t('changePassword.resentToast'))} />
      </div>
    </section>
  )
}

interface StepProps {
  email: string
  direction: Direction
  headingRef: RefObject<HTMLHeadingElement | null>
}

function panelClass(direction: Direction): string {
  return `pf-panel${direction ? ` pf-panel--${direction}` : ''}`
}

function ConfirmStep({ email, direction, headingRef, onSent }: StepProps & { onSent: () => void }) {
  const t = useTranslations('profile.changePassword')
  const inputRef = useRef<HTMLInputElement>(null)
  const [current, setCurrent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [state, formAction, pending] = useActionState(changePasswordAction, INITIAL_STATE)

  useEffect(() => {
    if (state === INITIAL_STATE) return
    if (state.ok) {
      setCurrent('')
      onSent()
      return
    }
    if (state.errorKey === 'errors.wrongPassword') {
      // A rejected password is one the browser should be free to forget.
      setCurrent('')
      setError(t('errors.wrongPassword'))
      inputRef.current?.focus()
      return
    }
    setError(state.detail ?? t('errors.genericError'))
    // The result object's identity is the trigger; onSent only advances the step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <form
      className={panelClass(direction)}
      action={formAction}
      noValidate
      onSubmit={(event) => {
        if (current === '') {
          event.preventDefault()
          setError(t('errors.empty'))
          inputRef.current?.focus()
          return
        }
        setError(null)
      }}
    >
      <h3 ref={headingRef} tabIndex={-1}>
        {t('heading')}
      </h3>
      <p className="pf-lead">{t('description')}</p>
      <input type="text" name="username" autoComplete="username" value={email} readOnly hidden />
      <PasswordField
        ref={inputRef}
        id="pf-current-password"
        name="currentPassword"
        label={t('currentPasswordLabel')}
        autoComplete="current-password"
        value={current}
        disabled={pending}
        error={error}
        onChange={(value) => {
          setCurrent(value)
          if (error) setError(null)
        }}
      />
      <div className="pf-row">
        <button
          type="submit"
          className="pf-btn pf-btn--pri pf-btn--lg"
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? (
            <Spinner size={16} />
          ) : (
            <Mail size={16} strokeWidth={1.8} aria-hidden="true" />
          )}
          {pending ? t('submitting') : t('submit')}
        </button>
      </div>
    </form>
  )
}

function CheckEmailStep({
  email,
  direction,
  headingRef,
  resendAt,
  onResent,
  onStartOver,
}: StepProps & { resendAt: number; onResent: () => void; onStartOver: () => void }) {
  const t = useTranslations('profile.changePassword')
  const [pending, startTransition] = useTransition()
  const [failed, setFailed] = useState(false)
  const left = useCountdown(resendAt)

  const resend = () =>
    startTransition(async () => {
      const result = await requestOwnPasswordResetAction({ ok: true }, new FormData())
      setFailed(!result.ok)
      if (result.ok) onResent()
    })

  return (
    <div className={panelClass(direction)}>
      <span className="pf-mailart" aria-hidden="true">
        <MailCheck size={28} strokeWidth={1.8} />
      </span>
      <h3 ref={headingRef} tabIndex={-1}>
        {t('checkTitle')}
      </h3>
      <p className="pf-lead">{t.rich('checkText', { email, b: (chunks) => <b>{chunks}</b> })}</p>
      {failed ? (
        <p className="pf-msg pf-msg--err" role="alert">
          <TriangleAlert size={16} strokeWidth={1.8} aria-hidden="true" />
          {t('errors.genericError')}
        </p>
      ) : null}
      <div className="pf-row">
        <button
          type="button"
          className="pf-btn pf-btn--lg"
          disabled={pending || left > 0}
          aria-busy={pending}
          onClick={resend}
        >
          {pending ? (
            <Spinner size={16} />
          ) : left > 0 ? (
            <Clock size={16} strokeWidth={1.8} aria-hidden="true" />
          ) : (
            <RefreshCw size={16} strokeWidth={1.8} aria-hidden="true" />
          )}
          {left > 0 ? t('resendIn', { time: formatCountdown(left) }) : t('resend')}
        </button>
        <button type="button" className="pf-tlink" onClick={onStartOver}>
          {t('startOver')}
        </button>
      </div>
      <span className="pf-small">{t('spamHint')}</span>
    </div>
  )
}
