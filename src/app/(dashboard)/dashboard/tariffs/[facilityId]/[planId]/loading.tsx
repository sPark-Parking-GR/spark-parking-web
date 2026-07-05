import { PageHeader } from '@/components/PageHeader'
import { Skeleton } from '@/components/Skeleton'
import { TariffEditorSkeleton } from '@/components/TariffEditorSkeleton'

export default function Loading() {
  return (
    <>
      <PageHeader title="" titleAccessory={<Skeleton width={220} height={28} radius={8} />} />
      <TariffEditorSkeleton />
    </>
  )
}
