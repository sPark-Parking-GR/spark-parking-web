interface SparkMarkProps {
  size?: number
  title?: string
  gradientId?: string
  className?: string
}

const MARK_PATH =
  'M237.25 149.5H312.822C312.822 52 232.859 1 156.859 1C80.8585 1 5 73.5 5 149.5C5.00015 193.5 10.3674 218 33.7501 258.5H198.25C200.459 258.5 202.212 260.293 201.566 262.405C196.773 278.074 168.161 310.133 158.861 316.536C157.684 317.346 156.238 316.983 155.213 315.987C150.167 311.087 146.102 307.78 139.322 301H57.7132C65.5664 318.492 136.785 404.249 155.895 411.68C156.549 411.935 157.117 411.95 157.771 411.694C179.964 402.989 312.822 272.311 312.822 192H74.2501V149.5C74.2501 112.5 112.358 68.5 156.859 68.5C196.859 68.5 237.25 105.5 237.25 149.5Z'

export function SparkMark({
  size = 28,
  title = 'sPark',
  gradientId = 'spark-mark-grad',
  className,
}: SparkMarkProps) {
  return (
    <svg
      width={size}
      height={size * (421 / 318)}
      viewBox="0 0 318 421"
      fill="none"
      role="img"
      aria-label={title}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={MARK_PATH} fill={`url(#${gradientId})`} stroke="#0A6A99" strokeWidth={2} />
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0D7FB6" />
          <stop offset="0.495192" stopColor="#1094D4" />
          <stop offset="0.802885" stopColor="#32A5DC" />
        </linearGradient>
      </defs>
    </svg>
  )
}
