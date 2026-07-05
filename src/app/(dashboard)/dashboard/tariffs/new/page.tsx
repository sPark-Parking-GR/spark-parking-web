import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { TariffEditor } from '@/components/TariffEditor'
import { getSession } from '@/lib/session'
import { makeKey, ALL_DAYS_MASK } from '@/lib/tariff-schema'
import type { TariffDraft } from '@/lib/tariff-api'

function buildDefaultDraft(): TariffDraft {
  const windowKey = makeKey()
  const tierKey = makeKey()
  return {
    name: 'New tariff plan',
    isActive: true,
    isDefault: false,
    validFrom: null,
    validTo: null,
    timezone: 'Europe/Athens',
    graceMinutes: 0,
    incrementMinutes: 60,
    vehicleTypes: ['car'],
    tiers: [{ key: tierKey, fromMinute: 0, toMinute: null, unit: 'per_block', blockMinutes: 60 }],
    windows: [{ key: windowKey, label: 'All day', dayMask: ALL_DAYS_MASK, startMinute: 0, endMinute: 1440 }],
    rates: [{ tierKey, windowKey, priceCents: 0, currency: 'EUR' }],
    caps: [],
  }
}

export default async function NewTariffPlanPage() {
  const session = await getSession()
  if (!session.accessToken) redirect('/login')

  return (
    <>
      <PageHeader title="New tariff plan" />
      <TariffEditor mode="create" plan={buildDefaultDraft()} />
    </>
  )
}
