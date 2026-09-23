'use client'

import type { ReactElement } from 'react'

import { useTheme } from '../theme/ThemeProvider'
import type { ProgressBarProps, ProgressRingProps } from './Progress.types'

export type { ProgressBarProps, ProgressRingProps } from './Progress.types'

export function ProgressBar(props: ProgressBarProps): ReactElement {
  const { pct, colorOverride } = props
  const { colors, radii } = useTheme()

  const fillColor = colorOverride ?? (pct > 90 ? colors.bad : pct > 70 ? colors.warn : colors.ok)

  return (
    <div style={{ height: 8, borderRadius: radii.pill, background: colors.card2 }}>
      <div
        style={{ width: `${pct}%`, height: 8, borderRadius: radii.pill, background: fillColor }}
      />
    </div>
  )
}

export function ProgressRing(props: ProgressRingProps): ReactElement {
  const { pct, size = 150, children } = props
  const { colors } = useTheme()

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: `conic-gradient(${colors.pri} ${pct}%, ${colors.card2} 0)`,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 20,
          borderRadius: 999,
          background: colors.surface,
        }}
      />
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
    </div>
  )
}
