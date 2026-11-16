'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ArrowRight, CircleCheck, Clock } from 'lucide-react'

import { SetPasswordForm } from './SetPasswordForm'
import { AuthBanner } from './AuthBanner'
import { AuthShell } from './AuthShell'
import { AuthStatusPanel } from './AuthStatusPanel'
import { useAuthPageExit } from '@/lib/useAuthPageExit'
import type { InviteValidationResult } from '@/lib/invite-actions'
import type { LegalVersions } from '@spark/types'

/**
 * Client shell for the invite-accept page, mirroring LoginShell: owns the exit
 * animation + page-transition cover so a successful account creation hands off
 * to the dashboard the same way a successful sign-in does, instead of the plain
 * server-side redirect this page used to do (a hard cut, no exit animation).
 */
export function AcceptInviteShell({
  token,
  result,
  versions,
}: {
  token: string
  result: InviteValidationResult
  versions: LegalVersions | null
}) {
  const t = useTranslations('acceptInvite')
  const tLegal = useTranslations('legal')
  const { isExiting, triggerExit } = useAuthPageExit()

  const title = !result.ok
    ? t('invalidTitle')
    : result.data.alreadyAccepted
      ? t('alreadyAcceptedTitle')
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
      titleId="accept-invite-title"
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
      ) : result.data.alreadyAccepted ? (
        // A redeemed link is not a dead one: the account exists, so the person is one
        // click from where they were going. Telling them it "expired" sent them back to
        // the admin for a replacement invite they do not need.
        <AuthStatusPanel
          tone="ok"
          icon={<CircleCheck size={28} strokeWidth={1.75} />}
          message={t('alreadyAcceptedMessage')}
        >
          {toLogin}
        </AuthStatusPanel>
      ) : result.data.expired ? (
        // Signing in is the right move for anyone who already accepted an earlier link, so a
        // lapsed one offers it as well.
        <AuthStatusPanel icon={<Clock size={28} strokeWidth={1.75} />} message={t('expiredMessage')}>
          {toLogin}
        </AuthStatusPanel>
      ) : (
        <>
          <p className="auth-card__context">
            {result.data.kind === 'ONBOARDING'
              ? t('contextOnboarding', { email: result.data.email })
              : t.rich('context', {
                  businessName: result.data.businessName,
                  b: (chunks) => <strong>{chunks}</strong>,
                  email: result.data.email,
                })}
          </p>
          {result.data.requiresExistingPassword ? (
            <p className="auth-card__context">{t('linkedAccountNotice')}</p>
          ) : null}
          {versions ? (
            <SetPasswordForm
              token={token}
              email={result.data.email}
              versions={versions}
              requiresBusinessName={result.data.kind === 'ONBOARDING'}
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
