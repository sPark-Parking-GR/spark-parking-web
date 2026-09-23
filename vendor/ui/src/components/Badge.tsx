'use client'

import type { ReactElement, ReactNode } from 'react'

import { useTheme } from '../theme/ThemeProvider'

export type BadgeVariant = 'ok' | 'warn' | 'bad' | 'neutral'

export interface BadgeProps {
  variant: BadgeVariant
  children: ReactNode
}

export function Badge(props: BadgeProps): ReactElement {
  const { variant, children } = props
  const { colors, radii } = useTheme()

  const colorMap: Record<BadgeVariant, { text: string; bg: string }> = {
    ok: { text: colors.ok, bg: colors.okBg },
    warn: { text: colors.warn, bg: colors.warnBg },
    bad: { text: colors.bad, bg: colors.badBg },
    neutral: { text: colors.muted, bg: colors.card2 },
  }
  const { text, bg } = colorMap[variant]

  return (
    <span
      style={{
        padding: '4px 11px',
        borderRadius: radii.pill,
        fontSize: 11,
        fontWeight: 800,
        color: text,
        background: bg,
      }}
    >
      {children}
    </span>
  )
}
