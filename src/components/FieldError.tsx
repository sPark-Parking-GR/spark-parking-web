import type { ReactNode } from 'react'
import { CircleAlert } from 'lucide-react'

export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="auth-field-error" role="alert">
      <CircleAlert size={16} strokeWidth={2} aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}
