'use client'

import Link from 'next/link'
import { useActionState, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Building2, Mail, UserRound } from 'lucide-react'
import { PASSWORD_MAX, PASSWORD_MIN } from '@spark/types'
import type { LegalVersions } from '@spark/types'
import { AuthBanner } from '@/components/AuthBanner'
import { FloatingInput } from '@/components/FloatingInput'
import { LegalConsent } from '@/components/LegalConsent'
import { PasswordField } from '@/components/PasswordField'
import { Spinner } from '@/components/Spinner'
import { stashAuthEmail } from '@/lib/auth-handoff'
import { emailField } from '@/lib/email-schema'
import { readLegalFields } from '@/lib/legal-schema'
import { registerOperatorAction } from '@/lib/operator-registration-actions'

type Field = 'displayName' | 'email' | 'businessName' | 'password' | 'confirmPassword' | 'legal'
type FieldErrors = Partial<Record<Field, string>>
type RegisterState = { error: string | null; emailTaken: boolean }

const INITIAL_STATE: RegisterState = { error: null, emailTaken: false }

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
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLInputElement>(null)

  // Controlled for the same reason as the login form: React 19 resets an uncontrolled form once
  // its action resolves, which would wipe everything after one failed submit.
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

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
      case 'confirmPassword':
        return values.confirmPassword === values.password ? null : t('passwordsMismatch')
      default:
        return null
    }
  }

  const values = { displayName, email, businessName, password, confirmPassword }

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
      confirmPassword: confirmRef,
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
        'confirmPassword',
      ] as const) {
        const message = validate(field, values)
        if (message) found[field] = message
      }
      if (!legal.legalAccepted) found.legal = tLegal('required')

      setErrors(found)
      const firstInvalid = (
        ['displayName', 'email', 'businessName', 'password', 'confirmPassword', 'legal'] as const
      ).find((field) => found[field] !== undefined)
      if (firstInvalid) {
        focusField(firstInvalid)
        return { error: null, emailTaken: false }
      }

      const address = emailField().parse(email)
      const result = await registerOperatorAction({
        email: address,
        password,
        confirmPassword,
        businessName,
        displayName,
        legal,
      })
      if (!result.ok) {
        return { error: t(result.errorKey), emailTaken: result.errorKey === 'emailTaken' }
      }

      if (result.redirectTo.startsWith('/login')) stashAuthEmail(address)
      onRegisterSuccess(result.redirectTo)
      return { error: null, emailTaken: false }
    },
    INITIAL_STATE,
  )

  const fieldProps = (field: Exclude<Field, 'legal'>) => ({
    'aria-invalid': errors[field] ? (true as const) : undefined,
    'aria-describedby': errors[field] ? `register-${field}-error` : undefined,
  })

  const fieldError = (field: Field) =>
    errors[field] ? (
      <p id={`register-${field}-error`} className="field__error auth-field-error" role="alert">
        {errors[field]}
      </p>
    ) : null

  return (
    <form ref={formRef} action={formAction} className="auth-form" noValidate>
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

      <PasswordField
        ref={confirmRef}
        id="register-confirmPassword"
        name="confirmPassword"
        label={t('confirmPasswordLabel')}
        autoComplete="new-password"
        disabled={isPending}
        value={confirmPassword}
        onChange={(value) => {
          setConfirmPassword(value)
          clearError('confirmPassword')
        }}
        onBlur={() => {
          if (confirmPassword.length > 0) checkField('confirmPassword')
        }}
        error={errors.confirmPassword ?? null}
      />

      {state.error ? (
        <AuthBanner tone={state.emailTaken ? 'warn' : 'error'}>
          <span>{state.emailTaken ? t('emailTakenTitle') : state.error}</span>
          {state.emailTaken ? (
            <span className="auth-alert__actions">
              <Link
                href="/login"
                className="btn btn--ghost btn--sm"
                onClick={() => stashAuthEmail(email)}
              >
                {t('signIn')}
              </Link>
              <Link
                href="/forgot-password"
                className="btn btn--ghost btn--sm"
                onClick={() => stashAuthEmail(email)}
              >
                {t('resetPassword')}
              </Link>
            </span>
          ) : null}
        </AuthBanner>
      ) : null}

      <LegalConsent
        versions={versions}
        disabled={isPending}
        invalid={Boolean(errors.legal)}
        describedBy={errors.legal ? 'register-legal-error' : undefined}
      />
      {fieldError('legal')}

      <button
        type="submit"
        className="btn btn--primary btn--block auth-submit"
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending ? <Spinner size={16} /> : null}
        {isPending ? t('submitting') : t('submit')}
      </button>
    </form>
  )
}
