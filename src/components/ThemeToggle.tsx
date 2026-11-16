'use client'

import type { ReactElement } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTheme } from '@spark/ui'

export function ThemeToggle(): ReactElement {
  const { mode, toggle } = useTheme()
  const t = useTranslations('shell')
  const label = mode === 'dark' ? t('switchToLightMode') : t('switchToDarkMode')
  const Icon = mode === 'dark' ? Sun : Moon

  return (
    <button
      type="button"
      className="ds-ibtn"
      onClick={toggle}
      aria-label={label}
      data-tooltip={label}
      data-tooltip-pos="bottom"
    >
      <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
    </button>
  )
}
