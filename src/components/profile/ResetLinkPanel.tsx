'use client'

import { useState, useTransition } from 'react'
import { Check, KeyRound, Mail, RefreshCw, TriangleAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Spinner } from '@/components/Spinner'
import { requestOwnPasswordResetAction } from '@/lib/profile-actions'
import { formatCountdown, useCountdown } from './useCountdown'

// The API allows 3 forgot-password requests a minute; 30s keeps a resend well inside that.
export const RESEND_COOLDOWN_MS = 30_000

type Phase = 'idle' | 'sent' | 'failed'

/**
 * The same reset link the logged-out page sends, for somebody who cannot produce their current
 * password. No address is collected: the action reads it from the session on the server.
 */
export function ResetLinkPanel({ email, onResent }: { email: string; onResent?: () => void }) {
  const t = useTranslations('profile.forgotPassword')
  const [phase, setPhase] = useState<Phase>('idle')
  const [pending, startTransition] = useTransition()
  const [until, setUntil] = useState(0)
  const left = useCountdown(until)

  const send = () => {
    const resend = phase === 'sent'
    startTransition(async () => {
      const result = await requestOwnPasswordResetAction({ ok: true }, new FormData())
      if (result.ok) {
        setUntil(Date.now() + RESEND_COOLDOWN_MS)
        setPhase('sent')
        if (resend) onResent?.()
      } else {
        setPhase('failed')
      }
    })
  }

  if (phase === 'sent') {
    return (
      <div className="pf-alt pf-alt--sent pf-rise" role="status">
        <span className="pf-chip pf-chip--green" aria-hidden="true">
          <Check size={20} strokeWidth={1.8} />
        </span>
        <div className="pf-alt__text">
          <b>{t('sentTo', { email })}</b>
          <p>{t('sentHint')}</p>
        </div>
        <button
          type="button"
          className="pf-btn pf-btn--lg pf-btn--ghost"
          disabled={pending || left > 0}
          aria-busy={pending}
          onClick={send}
        >
          {pending ? (
            <Spinner size={16} />
          ) : (
            <RefreshCw size={16} strokeWidth={1.8} aria-hidden="true" />
          )}
          {left > 0 ? t('resendIn', { time: formatCountdown(left) }) : t('resend')}
        </button>
      </div>
    )
  }

  if (phase === 'failed') {
    return (
      <div className="pf-alt pf-alt--fail pf-rise" role="alert">
        <span className="pf-chip pf-chip--amber" aria-hidden="true">
          <TriangleAlert size={20} strokeWidth={1.8} />
        </span>
        <div className="pf-alt__text">
          <b>{t('failedTitle')}</b>
          <p>{t('failedHint')}</p>
        </div>
        <button
          type="button"
          className="pf-btn pf-btn--lg pf-btn--ghost"
          disabled={pending}
          aria-busy={pending}
          onClick={send}
        >
          {pending ? (
            <Spinner size={16} />
          ) : (
            <RefreshCw size={16} strokeWidth={1.8} aria-hidden="true" />
          )}
          {t('retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="pf-alt">
      <span className="pf-chip pf-chip--violet" aria-hidden="true">
        <KeyRound size={20} strokeWidth={1.8} />
      </span>
      <div className="pf-alt__text">
        <b>{t('heading')}</b>
        <p>{t('description')}</p>
      </div>
      <button
        type="button"
        className="pf-btn pf-btn--lg pf-btn--ghost"
        disabled={pending}
        aria-busy={pending}
        onClick={send}
      >
        {pending ? <Spinner size={16} /> : <Mail size={16} strokeWidth={1.8} aria-hidden="true" />}
        {pending ? t('submitting') : t('submit')}
      </button>
    </div>
  )
}
