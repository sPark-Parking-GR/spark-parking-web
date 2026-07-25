import type { ReactNode } from 'react'

export default function InviteLayout({ children }: { children: ReactNode }) {
  return <main className="auth-shell">{children}</main>
}
