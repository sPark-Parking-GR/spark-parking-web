import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/PageHeader'
import { TariffEditor } from '@/components/TariffEditor'
import { requireSession } from '@/lib/dal'
import { makeKey, ALL_DAYS_MASK } from '@/lib/tariff-schema'
import type { TariffDraft } from '@/lib/tariff-api'

function buildDefaultDraft(name: string, windowLabel: string): TariffDraft {
  const windowKey = makeKey()
  const tierKey = makeKey()
  return {
    name,
    isActive: true,
    isDefault: false,
    validFrom: null,
    validTo: null,
    timezone: 'Europe/Athens',
    graceMinutes: 0,
    incrementMinutes: 60,
    vehicleTypes: ['car'],
    tiers: [{ key: tierKey, fromMinute: 0, toMinute: null, unit: 'per_block', blockMinutes: 60 }],
    windows: [
      {
        key: windowKey,
        label: windowLabel,
        dayMask: ALL_DAYS_MASK,
        startMinute: 0,
        endMinute: 1440,
      },
    ],
    rates: [{ tierKey, windowKey, priceCents: 0, currency: 'EUR' }],
    caps: [],
  }
}

export default async function NewTariffPlanPage() {
  await requireSession()

  const t = await getTranslations('tariffs')

  return (
    <>
      <PageHeader title={t('new.pageTitle')} />
      <TariffEditor
        mode="create"
        plan={buildDefaultDraft(t('new.defaultName'), t('new.defaultWindowLabel'))}
      />
    </>
  )
}
