'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { AuthNote, AuthShell } from './AuthShell'
import { LoginForm } from './LoginForm'
import { useAuthPageExit } from '@/lib/useAuthPageExit'

type LoginError = 'forbidden' | 'restricted' | 'expired'

interface LoginShellProps {
  from?: string
  error?: LoginError
  reset?: 'success'
  linked?: 'success'
}

type Notice = { tone: 'ok' | 'warn'; messageKey: string }
type NoticePhase = 'shown' | 'leaving' | 'gone'

function noticeFor({ error, reset, linked }: Omit<LoginShellProps, 'from'>): Notice | null {
  if (error === 'forbidden') return { tone: 'warn', messageKey: 'forbiddenMessage' }
  if (error === 'restricted') return { tone: 'warn', messageKey: 'restrictedMessage' }
  if (error === 'expired') return { tone: 'warn', messageKey: 'sessionExpired' }
  if (reset === 'success') return { tone: 'ok', messageKey: 'resetSuccess' }
  if (linked === 'success') return { tone: 'ok', messageKey: 'accountLinked' }
  return null
}

export function LoginShell({ from, error, reset, linked }: LoginShellProps) {
  const t = useTranslations('login')
  const { isExiting, triggerExit } = useAuthPageExit()
  const notice = noticeFor({ error, reset, linked })
  const [noticePhase, setNoticePhase] = useState<NoticePhase>('shown')

  return (
    <AuthShell
      titleId="login-title"
      title={t('title')}
      tagline={t('tagline')}
      heroTitle={t('heroTitle')}
      heroSubtitle={t('heroSubtitle')}
      isExiting={isExiting}
      notice={
        notice && noticePhase !== 'gone' ? (
          <AuthNote
            tone={notice.tone}
            leaving={noticePhase === 'leaving'}
            onGone={() => setNoticePhase('gone')}
          >
            {t(notice.messageKey)}
          </AuthNote>
        ) : null
      }
    >
      <LoginForm
        from={from}
        onLoginSuccess={triggerExit}
        onEmailActivity={() => setNoticePhase((phase) => (phase === 'shown' ? 'leaving' : phase))}
      />
    </AuthShell>
  )
}
