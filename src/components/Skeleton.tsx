interface SkeletonProps {
  width?: string | number
  height?: string | number
  radius?: string | number
  className?: string
}

export function Skeleton({ width, height = '1em', radius = 6, className }: SkeletonProps) {
  return (
    <span
      className={`skeleton${className ? ` ${className}` : ''}`}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
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
