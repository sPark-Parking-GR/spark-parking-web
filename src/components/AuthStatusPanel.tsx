import type { ReactNode } from 'react'

/**
 * The "this page can't do its job" body shared by the auth pages: a tinted icon, one short
 * explanation and the way forward. Warn for dead or expired links, ok for something that
 * already succeeded, blue for neutral information.
 */
export function AuthStatusPanel({
  tone = 'warn',
  icon,
  message,
  children,
}: {
  tone?: 'warn' | 'ok' | 'info'
  icon: ReactNode
  message: ReactNode
  children?: ReactNode
}) {
  const modifier = tone === 'info' ? '' : ` auth-check__icon--${tone}`

  return (
    <div className="auth-form auth-check">
      <span className={`auth-check__icon${modifier}`} aria-hidden="true">
        {icon}
      </span>
      <p className="auth-card__context" role="status">
        {message}
      </p>
      {children}
    </div>
  )
}
