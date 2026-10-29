import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { hasPlatformPermission } from '@spark/types'
import { IngestionPanel } from '@/components/IngestionPanel'
import { PageHeader } from '@/components/PageHeader'
import { AuthRequiredError } from '@/lib/api'
import { requireSession } from '@/lib/dal'
import { getIngestionStatus } from '@/lib/ingestion-api'
import type { IngestionStatus } from '@/lib/ingestion-types'

export default async function IngestionPage() {
  const session = await requireSession()
  if (!session.user || !hasPlatformPermission(session.user.role, 'platform:tenant.write')) {
    redirect('/dashboard')
  }

  const t = await getTranslations('ingestion')

  let status: IngestionStatus | null = null
  try {
    status = await getIngestionStatus()
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
  }

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      {status ? (
        <IngestionPanel status={status} />
      ) : (
        <p className="form-banner form-banner--error" role="alert">
          {t('loadError')}
        </p>
      )}
    </>
  )
}
