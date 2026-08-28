// Neither EntitlementLimitExceededError nor SubscriptionFeatureRequiredError attaches a
// machine-readable `code` to its HTTP response (unlike the EMAIL_TAKEN case on invites), so
// the only way to tell "this 403/409 is a plan-limit refusal" apart from every other 403/409
// on the same endpoint is the message shape the API already commits to in
// apps/api/src/common/errors/domain.errors.ts. These patterns mirror that shape exactly.
const ENTITLEMENT_LIMIT_PATTERN =
  /^This operator's plan allows \d+ .+ and \d+ are already in use\. Upgrade the plan or remove one first\.$/

const FEATURE_REQUIRED_PATTERN =
  /^This operator's plan does not include ".+"\. Upgrade the plan to unlock it\.$/

export function isEntitlementLimitMessage(message: string | undefined): boolean {
  return typeof message === 'string' && ENTITLEMENT_LIMIT_PATTERN.test(message)
}

export function isFeatureRequiredMessage(message: string | undefined): boolean {
  return typeof message === 'string' && FEATURE_REQUIRED_PATTERN.test(message)
}
