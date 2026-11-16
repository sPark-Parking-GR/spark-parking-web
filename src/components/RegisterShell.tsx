'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { AuthBanner } from './AuthBanner'
import { AuthShell } from './AuthShell'
import { RegisterOperatorForm } from './RegisterOperatorForm'
import { useAuthPageExit } from '@/lib/useAuthPageExit'
import type { LegalVersions } from '@spark/types'

/**
 * Client shell for the operator sign-up page: owns the exit animation and page-transition
 * cover so a successful registration hands off to the dashboard the same way a successful
 * sign-in does.
 */
export function RegisterShell({
  enabled,
  versions,
}: {
  enabled: boolean
  versions: LegalVersions | null
}) {
  const t = useTranslations('registerOperator')
  const tLegal = useTranslations('legal')
  const { isExiting, triggerExit } = useAuthPageExit()

  return (
    <AuthShell
      titleId="register-operator-title"
      title={enabled ? t('title') : t('disabledTitle')}
      subtitle={enabled ? t('subtitle') : t('disabledMessage')}
      tagline={t('tagline')}
      heroTitle={t('heroTitle')}
      heroSubtitle={t('heroSubtitle')}
      isExiting={isExiting}
    >
      {!enabled ? (
        <p className="auth-card__forgot">
          <Link href="/login">{t('goToLogin')}</Link>
        </p>
      ) : versions ? (
        <RegisterOperatorForm versions={versions} onRegisterSuccess={triggerExit} />
      ) : (
        <AuthBanner>{tLegal('unavailable')}</AuthBanner>
      )}
    </AuthShell>
  )
}
