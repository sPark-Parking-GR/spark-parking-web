import { RegisterShell } from '@/components/RegisterShell'
import { fetchLegalVersions } from '@/lib/legal-api'
import { checkRegisterAvailabilityAction } from '@/lib/operator-registration-actions'

export default async function RegisterOperatorPage() {
  const [{ enabled }, versions] = await Promise.all([
    checkRegisterAvailabilityAction(),
    fetchLegalVersions(),
  ])

  return <RegisterShell enabled={enabled} versions={versions} />
}
