'use client'

import { Info } from 'lucide-react'

interface Props {
  text: string
  pos?: 'top' | 'right' | 'bottom'
}

export function FieldInfo({ text, pos = 'top' }: Props) {
  return (
    <button
      type="button"
      className="field-info"
      data-tooltip={text}
      data-tooltip-pos={pos}
      aria-label={text}
    >
      <Info size={12} strokeWidth={2.5} aria-hidden="true" />
    </button>
  )
}
