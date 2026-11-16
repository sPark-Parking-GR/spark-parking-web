import type { ReactNode } from 'react'

interface Props {
  tone?: 'empty' | 'error'
  icon: ReactNode
  title: string
  message: string
  children?: ReactNode
}

export function StateBlock({ tone = 'empty', icon, title, message, children }: Props) {
  return (
    <div
      className={`ov-state ov-rise${tone === 'error' ? ' ov-state--err' : ''}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <span className="ov-state__ic" aria-hidden="true">
        {icon}
      </span>
      <b>{title}</b>
      <p>{message}</p>
      {children}
    </div>
  )
}
