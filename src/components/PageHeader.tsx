import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="page-header">
      <div>
        <h1 className="h-display">{title}</h1>
        {description ? <p className="text-secondary">{description}</p> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </div>
  )
}
