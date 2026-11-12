'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AuthShell } from '@/components/AuthShell'
import { ResetPasswordForm } from '@/components/ResetPasswordForm'

export function ResetPasswordShell({ token }: { token: string }) {
  const t = useTranslations('resetPassword')
  const [linkInvalid, setLinkInvalid] = useState(false)

  return (
    <AuthShell
      titleId="reset-password-title"
      title={linkInvalid ? t('invalidTitle') : t('title')}
      subtitle={linkInvalid ? undefined : t('subtitle')}
      tagline={t('tagline')}
      heroTitle={t('heroTitle')}
      heroSubtitle={t('heroSubtitle')}
    >
      <ResetPasswordForm token={token} onInvalidToken={() => setLinkInvalid(true)} />
    </AuthShell>
  )
}
