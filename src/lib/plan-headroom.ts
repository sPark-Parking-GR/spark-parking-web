import { ApiError, AuthRequiredError } from './api'
import { getMyOperatorSubscription } from './operator-subscription-api'
import type { Entitlements, OperatorUsage } from '@spark/types'

type Quota = keyof OperatorUsage

const LIMIT_FOR: Record<Quota, keyof Pick<
  Entitlements,
  'maxFacilities' | 'maxTariffPlans' | 'maxStaffSeats'
>> = {
  facilities: 'maxFacilities',
  tariffPlans: 'maxTariffPlans',
  staffSeats: 'maxStaffSeats',
}

/**
 * Whether the operator can still add one of a quota'd resource, for the pages that disable
 * their own create button rather than letting the API refuse at submit.
 *
 * Reads the plan's real limit and the operator's real usage. The facilities page used to
 * infer this from `total === 0` — correct only while every plan allowed exactly one
 * facility, and wrong the moment anyone bought Growth, which allows five: their second
 * facility would have been refused by a disabled button the API would have happily accepted.
 *
 * Fails OPEN on purpose. This is a courtesy that saves a wasted form; the entitlement check
 * inside the write transaction is the actual limit. A billing-service blip should cost a
 * refusal at submit, not a create button nobody can press.
 */
export async function hasHeadroomFor(quota: Quota): Promise<boolean> {
  try {
    const subscription = await getMyOperatorSubscription()
    const limit = subscription.entitlements[LIMIT_FOR[quota]]
    if (limit === null) return true
    return subscription.usage[quota] < limit
  } catch (err) {
    if (err instanceof AuthRequiredError || err instanceof ApiError) return true
    return true
  }
}
