'use client'

import type { CSSProperties, ReactElement } from 'react'

import { useTheme } from '../theme/ThemeProvider'
import type { ButtonProps } from './Button.types'

export type { ButtonProps, ButtonVariant, ButtonSize } from './Button.types'

export function Button(props: ButtonProps): ReactElement {
  const { variant = 'primary', size = 'md', fullWidth, disabled, onPress, children } = props
  const { colors, radii, shadows } = useTheme()

  const sizeStyle: CSSProperties =
    size === 'md'
      ? { padding: '14px 20px', fontSize: 15, fontWeight: 800, borderRadius: radii.md }
      : { padding: '9px 16px', fontSize: 13, fontWeight: 700, borderRadius: radii.sm }

  const variantStyle: CSSProperties =
    variant === 'primary'
      ? {
          color: '#FFFFFF',
          background: `linear-gradient(180deg, ${colors.pri}, ${colors.pri2})`,
          border: 'none',
          boxShadow: shadows.glow,
        }
      : {
          color: colors.ink,
          background: 'transparent',
          border: `1px solid ${colors.line}`,
        }

  const style: CSSProperties = {
    ...sizeStyle,
    ...variantStyle,
    width: fullWidth ? '100%' : undefined,
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'default' : 'pointer',
  }

  return (
    <button type="button" style={style} disabled={disabled} onClick={onPress}>
      {children}
    </button>
  )
}
