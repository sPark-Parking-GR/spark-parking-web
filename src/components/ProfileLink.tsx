'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

export const PROFILE_HREF = '/dashboard/profile'

/**
 * The header's user block. It is the way to the profile page, so on that page it says so:
 * aria-current for assistive tech and a brand ring on the avatar (styled off the attribute).
 */
export function ProfileLink({
  label,
  tooltip,
  children,
}: {
  label: string
  tooltip: string
  children: ReactNode
}) {
  const pathname = usePathname()
  const onProfile = pathname === PROFILE_HREF

  return (
    <Link
      href={PROFILE_HREF}
      className="ds-who"
      aria-label={label}
      aria-current={onProfile ? 'page' : undefined}
      data-tooltip={tooltip}
      data-tooltip-pos="bottom"
    >
      {children}
    </Link>
  )
}
