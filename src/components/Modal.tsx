'use client'

import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  titleAccessory?: ReactNode
  wide?: boolean
  children?: ReactNode
}

export function Modal({ open, onClose, title, titleAccessory, wide, children }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={onClose}
    >
      <div className={`modal${wide ? ' modal--wide' : ''}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2 className="h-heading">{title}</h2>
          {titleAccessory}
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
