import { Skeleton, TableSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <>
      <Skeleton width={120} height={20} radius={8} />
      <Skeleton width={320} height={36} radius={10} />
      <TableSkeleton rows={4} columns={3} />
    </>
  )
}
