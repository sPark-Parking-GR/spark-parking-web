import type { ReactNode } from 'react'

interface Props {
  titleId: string
  title: string
  subtitle?: string
  actions?: ReactNode
  busy?: boolean
  className?: string
  children: ReactNode
}

export function SectionCard({
  titleId,
  title,
  subtitle,
  actions,
  busy,
  className,
  children,
}: Props) {
  return (
    <section
      className={`ov-card ov-section${className ? ` ${className}` : ''}`}
      aria-labelledby={titleId}
      aria-busy={busy ? true : undefined}
    >
      <div className="ov-chead">
        <div className="ov-chead__grow">
          <h2 id={titleId}>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  )
}
