'use client'

import type { CSSProperties, ReactElement, ReactNode } from 'react'

import { spacing } from '../tokens'
import { useTheme } from '../theme/ThemeProvider'

export interface CardProps {
  children: ReactNode
  padding?: number
  style?: CSSProperties
}

export function Card(props: CardProps): ReactElement {
  const { children, padding = spacing.lg, style } = props
  const { colors, radii, shadows } = useTheme()

  return (
    <div
      style={{
        padding,
        background: colors.surface,
        border: `1px solid ${colors.line}`,
        borderRadius: radii.lg,
        boxShadow: shadows.card,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
