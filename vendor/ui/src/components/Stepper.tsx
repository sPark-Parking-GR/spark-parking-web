'use client'

import type { CSSProperties, ReactElement } from 'react'

import { useTheme } from '../theme/ThemeProvider'
import { typography } from '../tokens'
import type { StepperProps } from './Stepper.types'

export type { StepperProps, StepperSize } from './Stepper.types'

function clamp(v: number, min: number, max?: number): number {
  const withMin = Math.max(v, min)
  return max === undefined ? withMin : Math.min(withMin, max)
}

export function Stepper(props: StepperProps): ReactElement {
  const {
    value,
    onChange,
    step = 1,
    min = 0,
    max,
    formatValue = String,
    disabled,
    size = 'md',
  } = props
  const { colors, radii } = useTheme()

  const buttonSize = size === 'md' ? 32 : 28
  const valueWidth = size === 'md' ? 76 : 64
  const fontSize = size === 'md' ? typography.label.fontSize : 13

  const canDecrement = !disabled && value > min
  const canIncrement = !disabled && (max === undefined || value < max)

  const buttonStyle: CSSProperties = {
    width: buttonSize,
    height: buttonSize,
    borderRadius: radii.sm,
    border: `1px solid ${colors.line}`,
    background: colors.card2,
    color: colors.ink,
    fontSize: 18,
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    cursor: 'pointer',
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <button
        type="button"
        style={{ ...buttonStyle, cursor: canDecrement ? 'pointer' : 'default' }}
        disabled={!canDecrement}
        onClick={() => onChange(clamp(value - step, min, max))}
      >
        &#8722;
      </button>
      <span
        style={{
          width: valueWidth,
          textAlign: 'center',
          fontSize,
          fontWeight: typography.label.fontWeight,
          color: colors.ink,
        }}
      >
        {formatValue(value)}
      </span>
      <button
        type="button"
        style={{ ...buttonStyle, cursor: canIncrement ? 'pointer' : 'default' }}
        disabled={!canIncrement}
        onClick={() => onChange(clamp(value + step, min, max))}
      >
        +
      </button>
    </div>
  )
}
