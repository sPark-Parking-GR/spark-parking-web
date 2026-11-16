'use client'

import Link from 'next/link'
import { useActionState, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowRight, Building2, Check, Mail, UserRound } from 'lucide-react'
import { PASSWORD_MAX, PASSWORD_MIN } from '@spark/types'
import type { LegalVersions } from '@spark/types'
import { AuthBanner } from '@/components/AuthBanner'
import { FieldError } from '@/components/FieldError'
import { FloatingInput } from '@/components/FloatingInput'
import { LegalConsent } from '@/components/LegalConsent'
import { PasswordField } from '@/components/PasswordField'
import { Spinner } from '@/components/Spinner'
import { stashAuthEmail } from '@/lib/auth-handoff'
import { emailField } from '@/lib/email-schema'
import { readLegalFields } from '@/lib/legal-schema'
import { registerOperatorAction } from '@/lib/operator-registration-actions'

type Field = 'displayName' | 'email' | 'businessName' | 'password' | 'legal'
type FieldErrors = Partial<Record<Field, string>>
type RegisterState = { error: string | null; emailTaken: boolean }

const INITIAL_STATE: RegisterState = { error: null, emailTaken: false }
// How long the green "Account created" state shows before the page exit starts.
const SUCCESS_HOLD_MS = 450

export function RegisterOperatorForm({
  versions,
  onRegisterSuccess,
}: {
  versions: LegalVersions
  onRegisterSuccess: (redirectTo: string) => void
}) {
  const t = useTranslations('registerOperator')
  const tLegal = useTranslations('legal')
  const tPassword = useTranslations('password')

  const formRef = useRef<HTMLFormElement>(null)
  const displayNameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const businessNameRef = useRef<HTMLInputElement>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const passwordRef = useRef<HTMLInputElement>(null)

  // Controlled for the same reason as the login form: React 19 resets an uncontrolled form once
  // its action resolves, which would wipe everything after one failed submit.
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [succeeded, setSucceeded] = useState(false)
  // Inputs are disabled while the action runs, and a disabled field cannot take focus, so the
  // field to focus is recorded here and applied once the action has settled.
  const pendingFocus = useRef<Field | null>(null)

  const validate = (
    field: Field,
    values: Record<Exclude<Field, 'legal'>, string>,
  ): string | null => {
    switch (field) {
      case 'displayName': {
        const name = values.displayName.trim()
        if (name.length < 1) return t('yourNameRequired')
        return name.length > 120 ? t('yourNameTooLong') : null
      }
      case 'email':
        return emailField(t('emailInvalid')).safeParse(values.email).success
          ? null
          : t('emailInvalid')
      case 'businessName': {
        const name = values.businessName.trim()
        if (name.length < 2) return t('businessNameRequired')
        return name.length > 200 ? t('businessNameTooLong') : null
      }
      case 'password':
        if (values.password.length === 0) return t('passwordRequired')
        if (values.password.length < PASSWORD_MIN) return t('passwordTooShort')
        return values.password.length > PASSWORD_MAX ? t('passwordTooLong') : null
      default:
        return null
    }
  }

  const values = { displayName, email, businessName, password }

  const setFieldError = (field: Field, message: string | null) =>
    setErrors((current) => {
      const next = { ...current }
      if (message === null) delete next[field]
      else next[field] = message
      return next
    })

  const checkField = (field: Exclude<Field, 'legal'>) =>
    setFieldError(field, validate(field, values))

  const clearError = (field: Field) => {
    if (errors[field]) setFieldError(field, null)
  }

  const focusField = (field: Field) => {
    const refs = {
      displayName: displayNameRef,
      email: emailRef,
      businessName: businessNameRef,
      password: passwordRef,
    } as const
    if (field === 'legal') {
      formRef.current?.querySelector<HTMLInputElement>('input[name="legalAccepted"]')?.focus()
    } else {
      refs[field].current?.focus()
    }
  }

  const [state, formAction, isPending] = useActionState(
    async (_prev: RegisterState, formData: FormData): Promise<RegisterState> => {
      const legal = readLegalFields(formData)
      const found: FieldErrors = {}
      for (const field of [
        'displayName',
        'email',
        'businessName',
        'password',
      ] as const) {
        const message = validate(field, values)
        if (message) found[field] = message
      }
      if (!legal.legalAccepted) found.legal = tLegal('required')

      setErrors(found)
      const firstInvalid = (
        ['displayName', 'email', 'businessName', 'password', 'legal'] as const
      ).find((field) => found[field] !== undefined)
      if (firstInvalid) {
        pendingFocus.current = firstInvalid
        return { error: null, emailTaken: false }
      }

      const address = emailField().parse(email)
      const result = await registerOperatorAction({
        email: address,
        password,
        businessName,
        displayName,
        legal,
      })
      if (!result.ok) {
        return { error: t(result.errorKey), emailTaken: result.errorKey === 'emailTaken' }
      }

      if (result.redirectTo.startsWith('/login')) stashAuthEmail(address)
      setSucceeded(true)
      await new Promise((resolve) => setTimeout(resolve, SUCCESS_HOLD_MS))
      // The person left during the hold: do not redirect them back.
      if (!mounted.current) return { error: null, emailTaken: false }
      onRegisterSuccess(result.redirectTo)
      return { error: null, emailTaken: false }
    },
    INITIAL_STATE,
  )

  useEffect(() => {
    if (isPending || pendingFocus.current === null) return
    focusField(pendingFocus.current)
    pendingFocus.current = null
  })

  const fieldProps = (field: Exclude<Field, 'legal'>) => ({
    'aria-invalid': errors[field] ? (true as const) : undefined,
    'aria-describedby': errors[field] ? `register-${field}-error` : undefined,
  })

  const fieldError = (field: Field) =>
    errors[field] ? (
      <FieldError id={`register-${field}-error`}>{errors[field]}</FieldError>
    ) : null

  return (
    <form ref={formRef} action={formAction} className="auth-form" noValidate>
      {state.error ? (
        <AuthBanner>
          {state.emailTaken ? (
            <>
              <span>
                <strong>{t('emailTakenTitle')}</strong> {t('emailTakenHint')}
              </span>
              <span className="auth-alert__actions">
                <Link
                  href="/login"
                  className="auth-alert__link"
                  onClick={() => stashAuthEmail(email)}
                >
                  {t('signIn')}
                </Link>
                <Link
                  href="/forgot-password"
                  className="auth-alert__link"
                  onClick={() => stashAuthEmail(email)}
                >
                  {t('resetPassword')}
                </Link>
              </span>
            </>
          ) : (
            <span>{state.error}</span>
          )}
        </AuthBanner>
      ) : null}

      <div className="field">
        <FloatingInput
          ref={displayNameRef}
          id="register-displayName"
          label={t('yourNameLabel')}
          icon={<UserRound size={18} strokeWidth={2} />}
          type="text"
          name="displayName"
          autoComplete="name"
          autoFocus
          required
          disabled={isPending}
          value={displayName}
          onChange={(event) => {
            setDisplayName(event.target.value)
            clearError('displayName')
          }}
          onBlur={() => checkField('displayName')}
          {...fieldProps('displayName')}
        />
        {fieldError('displayName')}
      </div>

      <div className="field">
        <FloatingInput
          ref={emailRef}
          id="register-email"
          label={t('emailLabel')}
          icon={<Mail size={18} strokeWidth={2} />}
          type="email"
          name="email"
          autoComplete="username"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          disabled={isPending}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            clearError('email')
          }}
          onBlur={() => checkField('email')}
          valid={email.length > 0 && !errors.email && emailField().safeParse(email).success}
          {...fieldProps('email')}
        />
        {fieldError('email')}
      </div>

      <div className="field">
        <FloatingInput
          ref={businessNameRef}
          id="register-businessName"
          label={t('businessNameLabel')}
          icon={<Building2 size={18} strokeWidth={2} />}
          type="text"
          name="businessName"
          autoComplete="organization"
          required
          disabled={isPending}
          value={businessName}
          onChange={(event) => {
            setBusinessName(event.target.value)
            clearError('businessName')
          }}
          onBlur={() => checkField('businessName')}
          {...fieldProps('businessName')}
        />
        {fieldError('businessName')}
      </div>

      <PasswordField
        ref={passwordRef}
        id="register-password"
        name="password"
        label={t('passwordLabel')}
        autoComplete="new-password"
        disabled={isPending}
        value={password}
        onChange={(value) => {
          setPassword(value)
          clearError('password')
        }}
        onBlur={() => checkField('password')}
        error={errors.password ?? null}
        hint={tPassword('hint', { min: PASSWORD_MIN })}
        showStrength
      />

      <LegalConsent
        versions={versions}
        disabled={isPending}
        invalid={Boolean(errors.legal)}
        onCheckedChange={(checked) => {
          if (checked) clearError('legal')
        }}
        describedBy={errors.legal ? 'register-legal-error' : undefined}
      />
      {fieldError('legal')}

      <button
        type="submit"
        className={`btn btn--primary btn--block auth-submit${succeeded ? ' auth-submit--done' : ''}`}
        disabled={isPending || succeeded}
        aria-busy={isPending && !succeeded}
      >
        {succeeded ? (
          <Check size={20} strokeWidth={2.6} aria-hidden="true" />
        ) : isPending ? (
          <Spinner size={16} />
        ) : null}
        {succeeded ? t('accountCreated') : isPending ? t('submitting') : t('submit')}
        {isPending || succeeded ? null : (
          <ArrowRight size={16} strokeWidth={2.25} aria-hidden="true" />
        )}
      </button>
    </form>
  )
}
