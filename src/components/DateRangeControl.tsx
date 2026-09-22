import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { RANGE_PRESETS, type RangePreset } from '@/lib/date-range'

interface Props {
  active: RangePreset
  buildHref: (preset: RangePreset) => string
}

export async function DateRangeControl({ active, buildHref }: Props) {
  const t = await getTranslations('dateRange')

  return (
    <div className="tabs" role="group" aria-label={t('ariaLabel')}>
      {RANGE_PRESETS.map((preset) => (
        <Link
          key={preset}
          href={buildHref(preset)}
          className={`tab ${preset === active ? 'tab--active' : ''}`}
        >
          {t(`presets.${preset}`)}
        </Link>
      ))}
    </div>
  )
}
