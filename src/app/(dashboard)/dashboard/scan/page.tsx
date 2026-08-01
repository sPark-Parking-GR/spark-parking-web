import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/PageHeader'
import { QrScanner } from '@/components/QrScanner'
import { requireSession } from '@/lib/dal'

export default async function ScanPage() {
  await requireSession()

  const t = await getTranslations('scan')

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <QrScanner />
    </>
  )
}
