import { RegisterShell } from '@/components/RegisterShell'
import { checkRegisterAvailabilityAction } from '@/lib/operator-registration-actions'

export default async function RegisterOperatorPage() {
  const { enabled } = await checkRegisterAvailabilityAction()

  return <RegisterShell enabled={enabled} />
}
