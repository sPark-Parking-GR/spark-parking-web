import type { AnimationEvent, ReactNode } from 'react'

interface AuthBannerProps {
  tone?: 'error' | 'warn'
  id?: string
  leaving?: boolean
  onAnimationEnd?: (event: AnimationEvent<HTMLDivElement>) => void
  children: ReactNode
}

export function AuthBanner({
  tone = 'error',
  id,
  leaving,
  onAnimationEnd,
  children,
}: AuthBannerProps) {
  return (
    <div
      id={id}
      className={`auth-alert${tone === 'warn' ? ' auth-alert--warn' : ''}${leaving ? ' auth-alert--leaving' : ''}`}
      role="alert"
      onAnimationEnd={onAnimationEnd}
    >
      {children}
    </div>
  )
}
