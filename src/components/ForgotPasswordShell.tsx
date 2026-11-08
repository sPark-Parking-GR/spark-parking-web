'use client'

import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { MailCheck } from 'lucide-react'
import { AuthBanner } from '@/components/AuthBanner'
import { AuthShell } from '@/components/AuthShell'
import { ForgotPasswordForm } from '@/components/ForgotPasswordForm'
import { Spinner } from '@/components/Spinner'
import { forgotPasswordAction } from '@/lib/password-reset-actions'

const RESEND_COOLDOWN_SECONDS = 30

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

// Names the address but says nothing about whether an account exists for it: the API answers
// the same either way, and so does this screen.
function CheckEmail({ email, onUseDifferent }: { email: string; onUseDifferent: () => void }) {
  const t = useTranslations('forgotPassword')
  const [cooldownEnd, setCooldownEnd] = useState(() => Date.now() + RESEND_COOLDOWN_SECONDS * 1000)
  const [remaining, setRemaining] = useState(RESEND_COOLDOWN_SECONDS)
  const [error, setError] = useState<string | null>(null)
  const [resent, setResent] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, Math.ceil((cooldownEnd - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [cooldownEnd])

  const resend = () => {
    setError(null)
    setResent(false)
    startTransition(async () => {
      const result = await forgotPasswordAction({ email })
      if (!result.ok) {
        setError(t(result.errorKey))
        return
      }
      setResent(true)
      setCooldownEnd(Date.now() + RESEND_COOLDOWN_SECONDS * 1000)
    })
  }

  return (
    <div className="auth-form auth-check">
      <span className="auth-check__icon" aria-hidden="true">
        <MailCheck size={28} strokeWidth={1.75} />
      </span>
      <p className="auth-card__context" role="status">
        {t('checkMessage', { email })}
      </p>

      {error ? <AuthBanner tone="warn">{error}</AuthBanner> : null}
      {resent && !error ? (
        <p className="auth-field-hint auth-field-hint--center" role="status">
          {t('resent')}
        </p>
      ) : null}

      <button
        type="button"
        className="btn btn--primary btn--block auth-submit"
        onClick={resend}
        disabled={isPending || remaining > 0}
        aria-busy={isPending}
      >
        {isPending ? <Spinner size={16} /> : null}
        {remaining > 0 ? t('resendIn', { time: formatCountdown(remaining) }) : t('resend')}
      </button>

      <p className="auth-card__forgot">
        <button type="button" className="auth-link-button" onClick={onUseDifferent}>
          {t('useDifferentEmail')}
        </button>
      </p>
      <p className="auth-card__forgot">
        <Link href="/login">{t('backToLogin')}</Link>
      </p>
    </div>
  )
}

export function ForgotPasswordShell() {
  const t = useTranslations('forgotPassword')
  const [sentTo, setSentTo] = useState<string | null>(null)

  return (
    <AuthShell
      titleId="forgot-password-title"
      title={sentTo ? t('checkTitle') : t('title')}
      subtitle={sentTo ? undefined : t('subtitle')}
      tagline={t('tagline')}
      heroTitle={t('heroTitle')}
      heroSubtitle={t('heroSubtitle')}
    >
      {sentTo ? (
        <CheckEmail email={sentTo} onUseDifferent={() => setSentTo(null)} />
      ) : (
        <ForgotPasswordForm onSent={setSentTo} />
      )}
    </AuthShell>
  )
}
