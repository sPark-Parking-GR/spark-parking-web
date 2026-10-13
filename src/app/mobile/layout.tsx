import type { ReactNode } from 'react'

export default function MobileLayout({ children }: { children: ReactNode }) {
  return <main className="auth-shell">{children}</main>
}
