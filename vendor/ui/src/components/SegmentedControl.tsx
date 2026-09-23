'use client'

import type { ReactElement } from 'react'

import { useTheme } from '../theme/ThemeProvider'
import type { SegmentedControlProps } from './SegmentedControl.types'

export function SegmentedControl(props: SegmentedControlProps): ReactElement {
  const { options, value, onChange, size = 'md', variant = 'compact' } = props
  const { colors, radii } = useTheme()

  const selectedBackground = `linear-gradient(180deg, ${colors.pri}, ${colors.pri2})`

  if (variant === 'spaced') {
    return (
      <div style={{ display: 'inline-flex', gap: 8 }}>
        {options.map((option) => {
          const selected = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              style={{
                borderRadius: radii.md,
                border: selected ? 'none' : `1px solid ${colors.line}`,
                cursor: 'pointer',
                padding: '9px 16px',
                fontSize: 13,
                fontWeight: 700,
                background: selected ? selectedBackground : 'transparent',
                color: selected ? '#fff' : colors.muted,
              }}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        padding: 4,
        borderRadius: radii.pill,
        background: colors.card2,
        border: `1px solid ${colors.line}`,
      }}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            style={{
              borderRadius: radii.pill,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 800,
              padding: size === 'md' ? '6px 12px' : '9px 16px',
              fontSize: size === 'md' ? 12 : 13,
              background: selected ? selectedBackground : 'transparent',
              color: selected ? '#fff' : colors.muted,
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
