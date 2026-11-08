'use client'

import { useTranslations } from 'next-intl'
import { AuthShell } from '@/components/AuthShell'
import { ResetPasswordForm } from '@/components/ResetPasswordForm'

export function ResetPasswordShell({ token }: { token: string }) {
  const t = useTranslations('resetPassword')

  return (
    <AuthShell
      titleId="reset-password-title"
      title={t('title')}
      tagline={t('tagline')}
      heroTitle={t('heroTitle')}
      heroSubtitle={t('heroSubtitle')}
    >
      <ResetPasswordForm token={token} />
    </AuthShell>
  )
}
