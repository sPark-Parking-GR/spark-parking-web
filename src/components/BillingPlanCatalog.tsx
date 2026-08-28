'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { AlertCircle } from 'lucide-react'
import { Badge } from '@spark/ui'
import { UpgradeRequestModal } from './UpgradeRequestModal'
import { Spinner } from './Spinner'
import { FEATURE_LABEL_KEY, QUOTA_KEYS, bpsToPercentInput } from '@/lib/operator-plan-schema'
import { formatMoney } from '@/lib/booking-format'
import { startOperatorCheckoutAction } from '@/lib/operator-subscription-actions'
import type { OperatorPlanSummary } from '@/lib/operator-subscription-api'
import type { BillingInterval } from '@spark/types'

interface Props {
  plans: OperatorPlanSummary[]
  currentPlanCode: string | null
}

const INTERVAL_LABEL_KEY: Record<BillingInterval, string> = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
}

export function BillingPlanCatalog({ plans, currentPlanCode }: Props) {
  const t = useTranslations('billing')
  const [target, setTarget] = useState<OperatorPlanSummary | null>(null)
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null)
  const [error, setError] = useState<{ planId: string; message: string } | null>(null)
  const [, startTransition] = useTransition()

  const startCheckout = (plan: OperatorPlanSummary) => {
    setError(null)
    setCheckoutPlanId(plan.id)
    startTransition(async () => {
      const result = await startOperatorCheckoutAction(plan.id)
      if (!result.ok) {
        setError({ planId: plan.id, message: result.detail ?? t(result.errorKey) })
        setCheckoutPlanId(null)
        return
      }
      // Stripe Checkout is a different origin, so the router cannot take us there — and the
      // pending state is deliberately left on while the document navigation happens.
      window.location.href = result.checkoutUrl
    })
  }

  return (
    <>
      <div className="plan-grid">
        {plans.map((plan) => {
          const isCurrent = currentPlanCode !== null && plan.code === currentPlanCode
          return (
            <div
              key={plan.id}
              className={`card plan-card${isCurrent ? ' plan-card--current' : ''}`}
            >
              <div className="plan-card__head">
                <h3 className="panel-card__title">{plan.name}</h3>
                {isCurrent ? <Badge variant="ok">{t('plans.currentBadge')}</Badge> : null}
              </div>

              <p className="plan-card__price">
                {formatMoney(plan.priceCents, plan.currency)}
                <span className="text-secondary plan-card__interval">
                  {t(`plans.interval.${INTERVAL_LABEL_KEY[plan.interval]}`)}
                </span>
              </p>

              {plan.description ? <p className="text-secondary">{plan.description}</p> : null}

              <ul className="plan-card__list">
                {QUOTA_KEYS.map((quota) => {
                  const limit = plan.entitlements[quota]
                  return (
                    <li key={quota}>
                      {t('plans.quota', {
                        resource: t(`usage.${quota}`),
                        limit: limit === null ? t('usage.unlimitedShort') : String(limit),
                      })}
                    </li>
                  )
                })}
                <li>
                  {t('plans.commission', {
                    percent: bpsToPercentInput(plan.entitlements.commissionBps),
                  })}
                </li>
              </ul>

              {plan.entitlements.features.length > 0 ? (
                <span className="badge-stack">
                  {plan.entitlements.features.map((feature) => (
                    <Badge key={feature} variant="neutral">
                      {t(`features.names.${FEATURE_LABEL_KEY[feature]}`)}
                    </Badge>
                  ))}
                </span>
              ) : null}

              <div className="plan-card__actions">
                {isCurrent ? null : (
                  <>
                    {error?.planId === plan.id ? (
                      <p className="form-banner form-banner--error" role="alert">
                        <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
                        {error.message}
                      </p>
                    ) : null}

                    <button
                      type="button"
                      className="btn btn--primary btn--block"
                      disabled={checkoutPlanId !== null}
                      onClick={() => startCheckout(plan)}
                    >
                      {checkoutPlanId === plan.id ? (
                        <>
                          <Spinner size={15} />
                          {t('plans.startingCheckout')}
                        </>
                      ) : (
                        t('plans.upgradeNow')
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn btn--ghost-primary btn--sm btn--block"
                      disabled={checkoutPlanId !== null}
                      onClick={() => setTarget(plan)}
                    >
                      {t('plans.messageInstead')}
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <UpgradeRequestModal plan={target} onClose={() => setTarget(null)} />
    </>
  )
}
