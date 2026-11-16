'use client'

import Link from 'next/link'
import { useActionState, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowRight, Building2, Check, UserRound } from 'lucide-react'
import { z } from 'zod'
import { acceptInviteAction } from '@/lib/invite-actions'
import { AuthBanner } from './AuthBanner'
import { FieldError } from './FieldError'
import { FloatingInput } from './FloatingInput'
import { LegalConsent } from './LegalConsent'
import { PasswordField } from './PasswordField'
import { Spinner } from './Spinner'
import { readLegalFields } from '@/lib/legal-schema'
import { PASSWORD_MAX, PASSWORD_MIN, type LegalVersions } from '@spark/types'

type FieldName = 'displayName' | 'businessName' | 'password' | 'legal'
type FieldErrors = Partial<Record<FieldName, string>>
type SetPasswordState = { error: string | null; loginHint?: boolean }

const INITIAL_STATE: SetPasswordState = { error: null }
// How long the green "Account ready" state shows before the page exit starts.
const SUCCESS_HOLD_MS = 450

export function SetPasswordForm({
  token,
  email,
  versions,
  requiresBusinessName = false,
  requiresExistingPassword = false,
  onAcceptSuccess,
}: {
  token: string
  // Paired with the password by password managers; never sent anywhere.
  email: string
  versions: LegalVersions
  requiresBusinessName?: boolean
  // True when this address already has a mobile-only sPark account: accepting attaches
  // this invite to it instead of creating a new one, so the form collects the EXISTING
  // password (verified by sign-in) rather than letting the person choose a new one.
  requiresExistingPassword?: boolean
  onAcceptSuccess: (redirectTo: string) => void
}) {
  const t = useTranslations('acceptInvite')
  const tLegal = useTranslations('legal')
  const tPassword = useTranslations('password')
  const mounted = useRef(true)
  const [displayName, setDisplayName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [succeeded, setSucceeded] = useState(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const clearError = (field: FieldName) => {
    if (!errors[field]) return
    setErrors((current) => {
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const [state, formAction, isPending] = useActionState(
    async (_prev: SetPasswordState, formData: FormData): Promise<SetPasswordState> => {
      const legal = readLegalFields(formData)

      // An existing password is verified by sign-in server-side, not chosen here, so it gets
      // no strength floor.
      const passwordField = requiresExistingPassword
        ? z.string().min(1, t('passwordRequired'))
        : z
            .string()
            .min(PASSWORD_MIN, t('passwordTooShort'))
            .max(PASSWORD_MAX, t('passwordTooLong'))

      const parsed = z
        .object({
          password: passwordField,
          businessName: requiresBusinessName
            ? z.string().trim().min(1, t('businessNameRequired')).max(200, t('businessNameTooLong'))
            : z.string().trim().max(200, t('businessNameTooLong')).optional(),
          // Asked of everyone, including staff, who previously got no name at all and
          // showed up as a bare email address wherever people are listed.
          displayName: z
            .string()
            .trim()
            .min(1, t('yourNameRequired'))
            .max(120, t('yourNameTooLong')),
        })
        .safeParse({
          password: formData.get('password'),
          businessName: formData.get('businessName') ?? undefined,
          displayName: formData.get('displayName'),
        })

      const found: FieldErrors = {}
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          const field = issue.path[0] as FieldName
          if (found[field] === undefined) found[field] = issue.message
        }
      }
      if (!legal.legalAccepted) found.legal = tLegal('required')
      setErrors(found)
      if (!parsed.success || found.legal !== undefined) return { error: null }

      const result = await acceptInviteAction(token, {
        ...parsed.data,
        businessName: parsed.data.businessName,
        legal,
      })
      if (!result.ok) {
        return { error: result.detail ?? t(result.errorKey), loginHint: result.loginHint }
      }

      setSucceeded(true)
      await new Promise((resolve) => setTimeout(resolve, SUCCESS_HOLD_MS))
      // The person left during the hold: do not redirect them back.
      if (!mounted.current) return { error: null }
      onAcceptSuccess(result.redirectTo)
      return { error: null }
    },
    INITIAL_STATE,
  )

  return (
    <form action={formAction} className="auth-form" noValidate>
      {state.error ? (
        <AuthBanner>
          <span>{state.error}</span>
          {state.loginHint ? (
            <span className="auth-alert__actions">
              <Link href="/login" className="auth-alert__link">
                {t('goToLogin')}
              </Link>
            </span>
          ) : null}
        </AuthBanner>
      ) : null}

      <input
        type="text"
        name="username"
        autoComplete="username"
        value={email}
        readOnly
        tabIndex={-1}
        aria-hidden="true"
        className="auth-sr-only"
      />

      <div className="field">
        <FloatingInput
          id="accept-displayName"
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
          aria-invalid={errors.displayName ? true : undefined}
          aria-describedby={errors.displayName ? 'accept-displayName-error' : undefined}
        />
        {errors.displayName ? (
          <FieldError id="accept-displayName-error">{errors.displayName}</FieldError>
        ) : null}
      </div>

      {requiresBusinessName ? (
        <div className="field">
          <FloatingInput
            id="accept-businessName"
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
            aria-invalid={errors.businessName ? true : undefined}
            aria-describedby={errors.businessName ? 'accept-businessName-error' : undefined}
          />
          {errors.businessName ? (
            <FieldError id="accept-businessName-error">{errors.businessName}</FieldError>
          ) : null}
        </div>
      ) : null}

      <PasswordField
        id="accept-password"
        name="password"
        label={requiresExistingPassword ? t('existingPasswordLabel') : t('passwordLabel')}
        autoComplete={requiresExistingPassword ? 'current-password' : 'new-password'}
        disabled={isPending}
        value={password}
        onChange={(value) => {
          setPassword(value)
          clearError('password')
        }}
        error={errors.password ?? null}
        hint={requiresExistingPassword ? undefined : tPassword('hint', { min: PASSWORD_MIN })}
        showStrength={!requiresExistingPassword}
      />

      <LegalConsent
        versions={versions}
        disabled={isPending}
        invalid={Boolean(errors.legal)}
        onCheckedChange={(checked) => {
          if (checked) clearError('legal')
        }}
        describedBy={errors.legal ? 'accept-legal-error' : undefined}
      />
      {errors.legal ? <FieldError id="accept-legal-error">{errors.legal}</FieldError> : null}

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
        {succeeded ? t('success') : isPending ? t('submitting') : t('submit')}
        {isPending || succeeded ? null : (
          <ArrowRight size={16} strokeWidth={2.25} aria-hidden="true" />
        )}
      </button>
    </form>
  )
}
