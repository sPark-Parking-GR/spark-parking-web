import type { CSSProperties, ReactNode } from 'react'

export function Container({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <div className={`container fade-in${className ? ` ${className}` : ''}`} style={style}>
      {children}
    </div>
  )
}

export function AppBar() {
  return (
    <header className="appbar">
      <div className="appbar__inner">
        <a href="/" className="brand">
          Parqin
        </a>
        <span className="brand__tag">Make Parking Smart</span>
      </div>
    </header>
  )
}

export function Card({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <div className={`card${className ? ` ${className}` : ''}`} style={style}>
      {children}
    </div>
  )
}

type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral'

export function Badge({ children, variant = 'neutral' }: { children: ReactNode; variant?: BadgeVariant }) {
  return <span className={`badge badge--${variant}`}>{children}</span>
}

export function Button({
  children,
  variant = 'primary',
  fullWidth,
  type = 'button',
  disabled,
  onClick,
}: {
  children: ReactNode
  variant?: 'primary' | 'secondary'
  fullWidth?: boolean
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
}) {
  const classes = ['btn', `btn--${variant}`, fullWidth ? 'btn--block' : ''].filter(Boolean).join(' ')
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={classes}>
      {children}
    </button>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
    </label>
  )
}

export const inputClass = 'input'
