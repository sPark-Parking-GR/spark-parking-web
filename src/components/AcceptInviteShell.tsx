'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { SetPasswordForm } from './SetPasswordForm'
import { SparkMark } from './SparkMark'
import { useAuthPageExit } from '@/lib/useAuthPageExit'
import type { InviteValidationResult } from '@/lib/invite-actions'

/**
 * Client shell for the invite-accept page, mirroring LoginShell: owns the exit
 * animation + page-transition cover so a successful account creation hands off
 * to the dashboard the same way a successful sign-in does, instead of the plain
 * server-side redirect this page used to do (a hard cut, no exit animation).
 */
export function AcceptInviteShell({
  token,
  result,
}: {
  token: string
  result: InviteValidationResult
}) {
  const t = useTranslations('acceptInvite')
  const { isExiting, triggerExit } = useAuthPageExit()

  return (
    <div className="auth-stack">
      <div className={isExiting ? 'auth-brand auth-brand--exiting' : 'auth-brand'}>
        <span className="auth-brand__lockup">
          <SparkMark size={34} className="brand-lockup__mark" gradientId="spark-invite-grad" />
          <Image
            src="/sPark_title.png"
            alt="sPark"
            width={302}
            height={72}
            priority
            className="auth-brand__title"
          />
        </span>
        <p className="auth-brand__tagline">{t('tagline')}</p>
      </div>

      <section
        className={isExiting ? 'auth-card auth-card--exiting' : 'auth-card'}
        aria-labelledby="accept-invite-title"
      >
        {!result.ok ? (
          <>
            <h1 id="accept-invite-title" className="h-heading auth-card__title">
              {t('invalidTitle')}
            </h1>
            <p className="auth-alert" role="alert">
              {result.status === 404 ? t('invalidMessage') : t('invalidGenericMessage')}
            </p>
            <p className="auth-card__forgot">
              <Link href="/login">{t('goToLogin')}</Link>
            </p>
          </>
        ) : result.data.alreadyAccepted ? (
          // A redeemed link is not a dead one: the account exists, so the person is one
          // click from where they were going. Telling them it "expired" sent them back to
          // the admin for a replacement invite they do not need.
          <>
            <h1 id="accept-invite-title" className="h-heading auth-card__title">
              {t('alreadyAcceptedTitle')}
            </h1>
            <p className="auth-alert" role="alert">
              {t('alreadyAcceptedMessage')}
            </p>
            <p className="auth-card__forgot">
              <Link href="/login">{t('goToLogin')}</Link>
            </p>
          </>
        ) : result.data.expired ? (
          <>
            <h1 id="accept-invite-title" className="h-heading auth-card__title">
              {t('expiredTitle')}
            </h1>
            <p className="auth-alert" role="alert">
              {t('expiredMessage')}
            </p>
            {/* The invalid-link branch has always offered this; a lapsed link needs it just
                as much, since signing in is the right move for anyone who already accepted
                an earlier one. */}
            <p className="auth-card__forgot">
              <Link href="/login">{t('goToLogin')}</Link>
            </p>
          </>
        ) : (
          <>
            <h1 id="accept-invite-title" className="h-heading auth-card__title">
              {t('title')}
            </h1>
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
            <SetPasswordForm
              token={token}
              requiresBusinessName={result.data.kind === 'ONBOARDING'}
              requiresExistingPassword={result.data.requiresExistingPassword}
              onAcceptSuccess={triggerExit}
            />
          </>
        )}
      </section>
    </div>
  )
}
