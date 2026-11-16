'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AuthShell } from '@/components/AuthShell'
import { MobileResetPasswordForm } from '@/components/MobileResetPasswordForm'
import type { MobileResetPhase } from '@/components/MobileResetPasswordForm'

/**
 * The page the sPark app opens in a browser from a reset email. Same frame as the portal's
 * own reset page; the title follows what the form reports so a finished or dead link never
 * keeps asking for a password.
 */
export function MobileResetPasswordShell({ token }: { token: string }) {
  const t = useTranslations('mobileResetPassword')
  const [phase, setPhase] = useState<MobileResetPhase>('idle')

  const title =
    phase === 'done' ? t('success') : phase === 'expired' ? t('invalidTitle') : t('title')

  return (
    <AuthShell
      titleId="mobile-reset-password-title"
      title={title}
      subtitle={phase === 'idle' || phase === 'error' ? t('subtitle') : undefined}
      tagline={t('tagline')}
      heroTitle={t('heroTitle')}
      heroSubtitle={t('heroSubtitle')}
    >
      <MobileResetPasswordForm token={token} onPhaseChange={setPhase} />
    </AuthShell>
  )
}
