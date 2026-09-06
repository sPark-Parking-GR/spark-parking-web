import type { ReactElement } from 'react'
import { Inbox } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export function EmptyState({
  title,
  message,
  icon: Icon = Inbox,
}: {
  title: string
  message: string
  icon?: LucideIcon
}): ReactElement {
  return (
    <div className="empty-state" role="status">
      <span className="empty-state__icon" aria-hidden="true">
        <Icon size={28} strokeWidth={1.75} />
      </span>
      <p className="empty-state__title">{title}</p>
      <p className="text-secondary">{message}</p>
    </div>
  )
}
