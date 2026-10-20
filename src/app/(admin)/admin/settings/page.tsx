import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { hasPlatformPermission } from '@spark/types'
import { PageHeader } from '@/components/PageHeader'
import { BillingFlagToggle } from '@/components/BillingFlagToggle'
import { requireSession } from '@/lib/dal'
import { getSystemFeatures } from '@/lib/system-flags-api'

export default async function SystemSettingsPage() {
  const session = await requireSession()
  if (!hasPlatformPermission(session.user.role, 'platform:billing.manage')) {
    redirect('/dashboard')
  }

  const t = await getTranslations('systemSettings')
  const features = await getSystemFeatures()

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <BillingFlagToggle initialEnabled={features.billing} />
    </>
  )
}
