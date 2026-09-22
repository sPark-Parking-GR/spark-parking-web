import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  actions,
  titleAccessory,
}: {
  title: string
  description?: string
  actions?: ReactNode
  titleAccessory?: ReactNode
}) {
  return (
    <div className="page-header">
      <div>
        <div className="page-header__title-row">
          <h1 className="h-display">{title}</h1>
          {titleAccessory}
        </div>
        {description ? <p className="text-secondary">{description}</p> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </div>
  )
}
