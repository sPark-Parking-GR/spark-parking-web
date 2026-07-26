import type { CSSProperties, ReactNode } from 'react'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  radius?: string | number
  className?: string
  style?: CSSProperties
}

export function Skeleton({ width, height = '1em', radius = 6, className, style }: SkeletonProps) {
  return (
    <span
      className={`skeleton${className ? ` ${className}` : ''}`}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  )
}

export function FieldSkeleton() {
  return (
    <div className="field">
      <Skeleton width={96} height={13} className="field__label" />
      <Skeleton height={44} radius={8} />
    </div>
  )
}

export function EditorSectionSkeleton({
  headWidth = 96,
  children,
}: {
  headWidth?: number
  children: ReactNode
}) {
  return (
    <section className="editor-section card">
      <div className="editor-section__head">
        <Skeleton width={headWidth} height={16} />
      </div>
      {children}
    </section>
  )
}

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="table-wrapper" role="status" aria-label="Loading data">
      <table className="table">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, c) => (
              <th key={c}>
                <Skeleton width="60%" height={11} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c}>
                  <Skeleton width={c === 0 ? '70%' : '45%'} height={13} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
