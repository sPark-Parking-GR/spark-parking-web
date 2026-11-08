'use client'

import { useEffect, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { ThemeProvider, useTheme } from '@spark/ui'
import type { ThemeMode, ThemeOverride, ThemeStorageAdapter } from '@spark/ui'

const STORAGE_KEY = 'spark-theme'

// Storage can be unavailable (private mode, blocked site data): the theme then simply follows the
// system and the choice lasts for the page's lifetime.
function readStoredTheme(): ThemeOverride {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    return null
  }
}

const storage: ThemeStorageAdapter = {
  get: readStoredTheme,
  set(mode: ThemeOverride): void {
    try {
      if (mode === null) {
        window.localStorage.removeItem(STORAGE_KEY)
      } else {
        window.localStorage.setItem(STORAGE_KEY, mode)
      }
    } catch {
      // nothing to remember it with
    }
  },
}

function useSystemScheme(): ThemeMode {
  // Dark until the system says otherwise, matching the stylesheet's pre-hydration default.
  const [scheme, setScheme] = useState<ThemeMode>('dark')

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: light)')
    setScheme(query.matches ? 'light' : 'dark')

    const handleChange = (event: MediaQueryListEvent): void => {
      setScheme(event.matches ? 'light' : 'dark')
    }

    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  return scheme
}

function ThemeAttributeSync({ children }: { children: ReactNode }): ReactElement {
  const { mode } = useTheme()

  useEffect(() => {
    // The provider loads the stored choice in its own effect, which runs after this one; reading
    // it here too stops the attribute briefly flipping to the system scheme on every load.
    document.documentElement.dataset.theme = readStoredTheme() ?? mode
  }, [mode])

  return <>{children}</>
}

export function AppThemeProvider({ children }: { children: ReactNode }): ReactElement {
  const systemScheme = useSystemScheme()

  return (
    <ThemeProvider systemScheme={systemScheme} storage={storage}>
      <ThemeAttributeSync>{children}</ThemeAttributeSync>
    </ThemeProvider>
  )
}
