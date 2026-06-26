import { Loader2 } from 'lucide-react'

export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} strokeWidth={2.25} className={`spinner${className ? ` ${className}` : ''}`} aria-hidden="true" />
}
