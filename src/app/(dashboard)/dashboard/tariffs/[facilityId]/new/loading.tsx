import { PageHeader } from '@/components/PageHeader'
import { TariffEditorSkeleton } from '@/components/TariffEditorSkeleton'

export default function Loading() {
  return (
    <>
      <PageHeader title="New tariff plan" />
      <TariffEditorSkeleton />
    </>
  )
}
