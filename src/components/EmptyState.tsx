export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="empty-state" role="status">
      <p className="empty-state__title">{title}</p>
      <p className="text-secondary">{message}</p>
    </div>
  )
}
