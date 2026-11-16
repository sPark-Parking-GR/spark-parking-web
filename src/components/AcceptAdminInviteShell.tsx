'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ArrowRight, Clock } from 'lucide-react'

import { AuthBanner } from './AuthBanner'
import { AuthShell } from './AuthShell'
import { AuthStatusPanel } from './AuthStatusPanel'
import { SetAdminPasswordForm } from './SetAdminPasswordForm'
import { useAuthPageExit } from '@/lib/useAuthPageExit'
import type { ValidateAdminInviteResult } from '@/lib/admin-invite-actions'
import type { LegalVersions } from '@spark/types'

/**
 * Client shell for the platform-administrator invite page. Same frame and success handoff
 * as the operator invite page, so every way into the portal looks and ends the same.
 */
export function AcceptAdminInviteShell({
  token,
  result,
  versions,
}: {
  token: string
  result: ValidateAdminInviteResult
  versions: LegalVersions | null
}) {
  const t = useTranslations('adminInvites.accept')
  const tLegal = useTranslations('legal')
  const { isExiting, triggerExit } = useAuthPageExit()

  const title = !result.ok
    ? t('invalidTitle')
    : result.data.expired
      ? t('expiredTitle')
      : t('title')

  const toLogin = (
    <Link href="/login" className="btn btn--primary btn--block auth-submit">
      {t('goToLogin')}
      <ArrowRight size={16} strokeWidth={2.25} aria-hidden="true" />
    </Link>
  )

  return (
    <AuthShell
      titleId="accept-admin-invite-title"
      title={title}
      tagline={t('tagline')}
      heroTitle={t('heroTitle')}
      heroSubtitle={t('heroSubtitle')}
      isExiting={isExiting}
    >
      {!result.ok ? (
        <AuthStatusPanel
          icon={<Clock size={28} strokeWidth={1.75} />}
          message={result.status === 404 ? t('invalidMessage') : t('invalidGenericMessage')}
        >
          {toLogin}
        </AuthStatusPanel>
      ) : result.data.expired ? (
        <AuthStatusPanel icon={<Clock size={28} strokeWidth={1.75} />} message={t('expiredMessage')}>
          {toLogin}
        </AuthStatusPanel>
      ) : (
        <>
          <p className="auth-card__context">
            {t.rich('context', {
              email: result.data.email,
              b: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
          {result.data.requiresExistingPassword ? (
            <p className="auth-card__context">{t('linkedAccountNotice')}</p>
          ) : null}
          {versions ? (
            <SetAdminPasswordForm
              token={token}
              email={result.data.email}
              versions={versions}
              requiresExistingPassword={result.data.requiresExistingPassword}
              onAcceptSuccess={triggerExit}
            />
          ) : (
            <AuthBanner>{tLegal('unavailable')}</AuthBanner>
          )}
        </>
      )}
    </AuthShell>
  )
}
