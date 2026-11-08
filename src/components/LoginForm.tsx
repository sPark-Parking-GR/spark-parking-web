'use client'

import Link from 'next/link'
import { useActionState, useEffect, useId, useRef, useState } from 'react'
import type { CSSProperties, FormEvent, KeyboardEvent } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, TriangleAlert, X } from 'lucide-react'
import { FloatingInput } from '@/components/FloatingInput'
import { Spinner } from '@/components/Spinner'
import { signInAction } from '@/lib/auth-actions'
import type { SignInErrorKey } from '@/lib/auth-actions'
import { emailField } from '@/lib/email-schema'
import { forgetRecentLogin, readRecentLogins, rememberRecentLogin } from '@/lib/recent-logins'
import type { RecentLogin } from '@/lib/recent-logins'

type LoginErrorKind = SignInErrorKey | 'passwordRequired'
type LoginError = { kind: LoginErrorKind; message: string }
type LoginState = { error: LoginError | null }
type Step = 'email' | 'password'

const INITIAL_STATE: LoginState = { error: null }

const SLOW_SIGN_IN_MS = 8000
const DEFAULT_RETRY_AFTER_SECONDS = 60

// Errors the person can fix by changing the password they typed: only these mark the field
// invalid. A refused sign-in is deliberately generic, so the password is the one field it can
// be pinned on; an outage or a throttle is nobody's field.
const PASSWORD_FAULT_KINDS: ReadonlySet<LoginErrorKind> = new Set([
  'passwordRequired',
  'invalidCredentials',
  'credentialsInvalid',
  'notAuthorized',
])

const stagger = (index: number) => ({ '--i': index }) as CSSProperties

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

export function LoginForm({
  from,
  onLoginSuccess,
  onEmailActivity,
}: {
  from?: string
  onLoginSuccess: (redirectTo: string) => void
  onEmailActivity?: () => void
}) {
  const t = useTranslations('login')
  const uid = useId()
  const emailErrorId = `${uid}-email-error`
  const passwordErrorId = `${uid}-password-error`
  const alertId = `${uid}-alert`
  const capsId = `${uid}-caps`

  const formRef = useRef<HTMLFormElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('email')
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  // The entrance stagger belongs to the first paint only; replaying it when the person comes
  // back from step 2 would fight the step slide.
  const [staggered, setStaggered] = useState(true)

  // React 19 resets an uncontrolled form once its action resolves, so a wrong password
  // used to wipe the address too and make the retry a full re-type. Both fields are
  // controlled: the email is kept across a failure, the password is cleared explicitly
  // where a failed attempt makes that the expected behaviour.
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Off by default: a shared machine should not hold a sign-in open unless asked to.
  const [remember, setRemember] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [slow, setSlow] = useState(false)
  // Read after mount: localStorage does not exist during server render.
  const [recents, setRecents] = useState<RecentLogin[]>([])

  useEffect(() => {
    setRecents(readRecentLogins())
  }, [])

  const [state, formAction, isPending] = useActionState(
    async (_prev: LoginState, formData: FormData): Promise<LoginState> => {
      const submittedPassword = formData.get('password')
      if (typeof submittedPassword !== 'string' || submittedPassword.length === 0) {
        return { error: { kind: 'passwordRequired', message: t('passwordRequired') } }
      }

      const parsedEmail = emailField(t('emailInvalid')).safeParse(formData.get('email'))
      if (!parsedEmail.success) {
        setEmailError(parsedEmail.error.issues[0]?.message ?? t('emailInvalid'))
        setDirection('back')
        setStep('email')
        return { error: null }
      }

      const fromField = formData.get('from')
      const remembered = formData.get('remember') === 'on'
      const result = await signInAction(
        { email: parsedEmail.data, password: submittedPassword },
        typeof fromField === 'string' ? fromField : undefined,
        { remember: remembered },
      )

      if (!result.ok) {
        // An outage or a throttle is not the password's fault, so it is kept for the retry.
        if (result.errorKey !== 'signInFailed' && result.errorKey !== 'tooManyAttempts') {
          setPassword('')
        }
        if (result.errorKey === 'tooManyAttempts') {
          const seconds = result.retryAfter ?? DEFAULT_RETRY_AFTER_SECONDS
          setCooldownEnd(Date.now() + seconds * 1000)
        }
        return { error: { kind: result.errorKey, message: t(result.errorKey) } }
      }

      if (remembered) rememberRecentLogin(parsedEmail.data)
      onLoginSuccess(result.redirectTo)
      return { error: null }
    },
    INITIAL_STATE,
  )

  // Dismissal is keyed to the action result, so the next failed submit — a new state
  // object — shows its error again.
  const [dismissedState, setDismissedState] = useState<LoginState | null>(null)
  const [alertLeaving, setAlertLeaving] = useState(false)

  const error = state.error !== null && dismissedState !== state ? state.error : null
  const inlinePasswordError = error?.kind === 'passwordRequired' ? error : null
  const banner =
    error !== null && error.kind !== 'passwordRequired'
      ? error.kind === 'tooManyAttempts' && cooldownEnd === null
        ? null
        : error
      : null
  const passwordAtFault = error !== null && PASSWORD_FAULT_KINDS.has(error.kind) && !alertLeaving

  const passwordDescribedBy =
    [
      inlinePasswordError ? passwordErrorId : null,
      passwordAtFault && banner ? alertId : null,
      capsLock ? capsId : null,
    ]
      .filter((id): id is string => id !== null)
      .join(' ') || undefined

  useEffect(() => {
    if (cooldownEnd === null) {
      setCooldown(0)
      return undefined
    }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((cooldownEnd - Date.now()) / 1000))
      setCooldown(remaining)
      if (remaining === 0) setCooldownEnd(null)
    }
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [cooldownEnd])

  useEffect(() => {
    if (!isPending) {
      setSlow(false)
      return undefined
    }
    const id = setTimeout(() => setSlow(true), SLOW_SIGN_IN_MS)
    return () => clearTimeout(id)
  }, [isPending])

  useEffect(() => {
    if (state.error) passwordRef.current?.focus()
  }, [state])

  const validateEmail = (value: string): boolean => {
    const parsed = emailField(t('emailInvalid')).safeParse(value)
    if (parsed.success) {
      setEmailError(null)
      return true
    }
    setEmailError(parsed.error.issues[0]?.message ?? t('emailInvalid'))
    return false
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (step === 'password') return
    event.preventDefault()
    if (!validateEmail(email)) {
      emailRef.current?.focus()
      return
    }
    const parsed = emailField().safeParse(email)
    if (parsed.success) setEmail(parsed.data)
    setStaggered(false)
    setDirection('forward')
    setStep('password')
    onEmailActivity?.()
  }

  const handleChooseRecent = (chosen: string) => {
    setEmail(chosen)
    setEmailError(null)
    setStaggered(false)
    setDirection('forward')
    setStep('password')
    onEmailActivity?.()
  }

  const handleForgetRecent = (address: string) => {
    setRecents(forgetRecentLogin(address))
    emailRef.current?.focus()
  }

  const handleChangeEmail = () => {
    setDirection('back')
    setStep('email')
    setPassword('')
    setShowPassword(false)
    setCapsLock(false)
    setAlertLeaving(false)
    setDismissedState(state)
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    if (error === null) return
    if (error.kind === 'passwordRequired') {
      setDismissedState(state)
    } else if (PASSWORD_FAULT_KINDS.has(error.kind)) {
      setAlertLeaving(true)
    }
  }

  const handleCapsLock = (event: KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(event.getModifierState('CapsLock'))
  }

  const itemClass = (extra: string) => `${extra}${staggered ? ' auth-form__item' : ''}`.trim()

  const submitDisabled = isPending || cooldown > 0

  return (
    <form
      ref={formRef}
      action={step === 'password' ? formAction : undefined}
      onSubmit={handleSubmit}
      className="auth-form"
      noValidate
    >
      {from ? <input type="hidden" name="from" value={from} /> : null}

      {step === 'email' ? (
        <div key="email" className={staggered ? 'auth-step' : `auth-step auth-step--${direction}`}>
          {recents.length > 0 ? (
            <section className="auth-recents" aria-labelledby={`${uid}-recents`}>
              <h2 id={`${uid}-recents`} className="auth-recents__title">
                {t('recentTitle')}
              </h2>
              <ul className="auth-recents__list">
                {recents.map((recent) => (
                  <li key={recent.email} className="auth-recents__item">
                    <button
                      type="button"
                      className="auth-recents__pick"
                      onClick={() => handleChooseRecent(recent.email)}
                    >
                      <span className="auth-identity__avatar" aria-hidden="true">
                        {recent.email.charAt(0).toUpperCase()}
                      </span>
                      <span className="auth-identity__email">{recent.email}</span>
                      <ArrowRight size={16} strokeWidth={2.25} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="auth-recents__remove"
                      onClick={() => handleForgetRecent(recent.email)}
                      aria-label={t('recentRemove', { email: recent.email })}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <div className={itemClass('field')} style={stagger(0)}>
            <FloatingInput
              ref={emailRef}
              id={`${uid}-email`}
              label={t('emailLabel')}
              icon={<Mail size={18} strokeWidth={2} />}
              type="email"
              name="email"
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (emailError) setEmailError(null)
                onEmailActivity?.()
              }}
              onBlur={() => {
                if (email.length > 0) validateEmail(email)
              }}
              aria-invalid={emailError ? true : undefined}
              aria-describedby={emailError ? emailErrorId : undefined}
            />
            {emailError ? (
              <p id={emailErrorId} className="field__error auth-field-error" role="alert">
                {emailError}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            className={itemClass('btn btn--primary btn--block auth-submit')}
            style={stagger(1)}
          >
            {t('continue')}
            <ArrowRight size={16} strokeWidth={2.25} aria-hidden="true" />
          </button>

          <p className={itemClass('auth-card__forgot')} style={stagger(2)}>
            <Link href="/forgot-password">{t('forgot')}</Link>
          </p>
          <p className={itemClass('auth-card__forgot')} style={stagger(3)}>
            {t('newOperator')} <Link href="/register">{t('registerLink')}</Link>
          </p>
        </div>
      ) : (
        <div key="password" className={`auth-step auth-step--${direction}`}>
          <div className="auth-identity">
            <span className="auth-identity__avatar" aria-hidden="true">
              {email.charAt(0).toUpperCase()}
            </span>
            <span className="auth-identity__email">{email}</span>
            <button
              type="button"
              className="auth-identity__change"
              onClick={handleChangeEmail}
              disabled={isPending}
            >
              {t('change')}
            </button>
          </div>

          {/* Credentials are paired by the browser only when a username field sits beside the
              password, so the address from step 1 travels in a visually hidden one. */}
          <input
            type="text"
            name="email"
            autoComplete="username"
            value={email}
            readOnly
            tabIndex={-1}
            aria-hidden="true"
            className="auth-sr-only"
          />

          <div className="field">
            <FloatingInput
              ref={passwordRef}
              id={`${uid}-password`}
              label={t('passwordLabel')}
              icon={<LockKeyhole size={18} strokeWidth={2} />}
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              autoFocus
              required
              disabled={isPending}
              value={password}
              onChange={(event) => handlePasswordChange(event.target.value)}
              onKeyDown={handleCapsLock}
              onKeyUp={handleCapsLock}
              onBlur={() => setCapsLock(false)}
              aria-invalid={passwordAtFault ? true : undefined}
              aria-describedby={passwordDescribedBy}
              trailing={
                <button
                  type="button"
                  className="pw-input__toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                  aria-pressed={showPassword}
                  disabled={isPending}
                >
                  {showPassword ? (
                    <EyeOff size={16} aria-hidden="true" />
                  ) : (
                    <Eye size={16} aria-hidden="true" />
                  )}
                </button>
              }
            />
            {inlinePasswordError ? (
              <p id={passwordErrorId} className="field__error auth-field-error" role="alert">
                {inlinePasswordError.message}
              </p>
            ) : null}
            {capsLock ? (
              <p id={capsId} className="auth-field-hint" role="status">
                <TriangleAlert size={14} strokeWidth={2.25} aria-hidden="true" />
                {t('capsLockOn')}
              </p>
            ) : null}
          </div>

          <label className="auth-remember">
            <input
              type="checkbox"
              name="remember"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              disabled={isPending}
            />
            <span>{t('rememberMe')}</span>
          </label>

          {banner ? (
            <div
              id={alertId}
              className={`auth-alert${banner.kind === 'tooManyAttempts' ? ' auth-alert--warn' : ''}${alertLeaving ? ' auth-alert--leaving' : ''}`}
              role="alert"
              onAnimationEnd={(event) => {
                if (alertLeaving && event.target === event.currentTarget) {
                  setDismissedState(state)
                  setAlertLeaving(false)
                }
              }}
            >
              {banner.kind === 'tooManyAttempts' ? (
                <span>
                  <strong>{t('tooManyAttempts')}</strong> {t('tooManyAttemptsHint')}
                </span>
              ) : (
                <span>{banner.message}</span>
              )}
              {banner.kind === 'signInFailed' ? (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm auth-alert__action"
                  onClick={() => formRef.current?.requestSubmit()}
                  disabled={isPending}
                >
                  {t('tryAgain')}
                </button>
              ) : null}
            </div>
          ) : null}

          <button
            type="submit"
            className="btn btn--primary btn--block auth-submit"
            disabled={submitDisabled}
            aria-busy={isPending}
          >
            {isPending ? <Spinner size={16} /> : null}
            {cooldown > 0
              ? t('tryAgainIn', { time: formatCountdown(cooldown) })
              : isPending
                ? t('signingIn')
                : t('signIn')}
          </button>

          {slow ? (
            <p className="auth-field-hint auth-field-hint--center" role="status">
              {t('takingLonger')}
            </p>
          ) : null}

          <p className="auth-card__forgot">
            <Link href="/forgot-password">{t('forgot')}</Link>
          </p>
        </div>
      )}
    </form>
  )
}
