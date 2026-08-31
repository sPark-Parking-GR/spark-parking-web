import { ApiError } from './api'

// The API attaches these on the two plan refusals, alongside the parts a client needs to
// render an upgrade prompt (resource/limit/current, or feature). Matching on the code is
// what lets the server reword — or translate — those messages without silently turning
// every upgrade CTA in the product into a generic error toast, which is what the previous
// regex-on-English-prose approach did.
const ENTITLEMENT_LIMIT_CODE = 'ENTITLEMENT_LIMIT_EXCEEDED'
const FEATURE_REQUIRED_CODE = 'SUBSCRIPTION_FEATURE_REQUIRED'

export function isEntitlementLimitError(err: unknown): boolean {
  return err instanceof ApiError && err.code === ENTITLEMENT_LIMIT_CODE
}

export function isFeatureRequiredError(err: unknown): boolean {
  return err instanceof ApiError && err.code === FEATURE_REQUIRED_CODE
}
