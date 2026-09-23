'use client'

import type { ReactElement } from 'react'

import { useTheme } from '../theme/ThemeProvider'
import type { SwitchProps } from './Switch.types'

export function Switch(props: SwitchProps): ReactElement {
  const { checked, onChange, disabled } = props
  const { colors, radii } = useTheme()

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative',
        width: 42,
        height: 24,
        borderRadius: radii.pill,
        border: 'none',
        padding: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        background: checked
          ? `linear-gradient(180deg, ${colors.pri}, ${colors.pri2})`
          : colors.card2,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 21 : 3,
          width: 18,
          height: 18,
          borderRadius: radii.pill,
          background: '#fff',
          transition: 'left .2s',
        }}
      />
    </button>
  )
}
