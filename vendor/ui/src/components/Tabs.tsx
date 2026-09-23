'use client'

import type { ReactElement } from 'react'

import { useTheme } from '../theme/ThemeProvider'
import { typography } from '../tokens'
import type { TabsProps } from './Tabs.types'

export function Tabs(props: TabsProps): ReactElement {
  const { items, active, onChange } = props
  const { colors } = useTheme()

  return (
    <div style={{ display: 'flex', gap: 28, borderBottom: `1px solid ${colors.line}` }}>
      {items.map((item) => {
        const selected = item.key === active
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0 0 12px',
              fontSize: typography.label.fontSize,
              fontWeight: typography.label.fontWeight,
              color: selected ? colors.ink : colors.muted,
              borderBottom: `2px solid ${selected ? colors.pri : 'transparent'}`,
              marginBottom: -1,
            }}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
