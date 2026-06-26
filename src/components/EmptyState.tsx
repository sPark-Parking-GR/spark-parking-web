import { Inbox } from 'lucide-react'

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="empty-state" role="status">
      <span className="empty-state__icon" aria-hidden="true">
        <Inbox size={28} strokeWidth={1.75} />
      </span>
      <p className="empty-state__title">{title}</p>
      <p className="text-secondary">{message}</p>
    </div>
  )
}
