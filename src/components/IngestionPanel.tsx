'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useFormatter, useTranslations } from 'next-intl'
import { AlertTriangle, DatabaseZap, Inbox, Loader, MapPin, RefreshCw, Tags } from 'lucide-react'
import {
  retryFailedTilesAction,
  runPromotionAction,
  runReclassifyAction,
  setIngestionBacklogAction,
  type IngestionActionResult,
} from '@/lib/ingestion-actions'
import {
  activeTiles,
  coveragePercent,
  crawlState,
  NAMING_LAYERS,
  namingTotal,
} from '@/lib/ingestion-format'
import type { BacklogTickResult, IngestionStatus } from '@/lib/ingestion-types'
import { StatCard } from './StatCard'

const REFRESH_MS = 15_000

type Notice = { kind: 'ok' | 'error'; text: string }

export function IngestionPanel({ status }: { status: IngestionStatus }) {
  const t = useTranslations('ingestion')
  const format = useFormatter()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [notice, setNotice] = useState<Notice | null>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh()
    }, REFRESH_MS)
    return () => clearInterval(timer)
  }, [router])

  const { control } = status
  const state = crawlState(status)
  const percent = coveragePercent(status.coverage.planned, status.coverage.seeded)
  const failedTiles = status.tiles['FAILED'] ?? 0
  const namedTotal = namingTotal(status.naming)
  const redisUp = control.redis === 'ok'
  const when = (iso: string) =>
    format.dateTime(new Date(iso), { dateStyle: 'medium', timeStyle: 'short' })

  const perform = (
    action: () => Promise<IngestionActionResult>,
    success: (result: Extract<IngestionActionResult, { ok: true }>) => string,
  ) => {
    setNotice(null)
    startTransition(async () => {
      const result = await action()
      if (!result.ok) {
        setNotice({ kind: 'error', text: t(result.errorKey) })
        return
      }
      setNotice({ kind: 'ok', text: success(result) })
      router.refresh()
    })
  }

  const describeTick = (result: BacklogTickResult | null): string => {
    if (!result) return t('tick.unknown')
    if ('paused' in result) return t('tick.paused')
    return t('tick.summary', {
      seeded: result.seeded,
      retried: result.retried,
      inFlight: result.inFlight,
    })
  }

  const chips: Array<{ label: string; up: boolean }> = [
    { label: t('health.redis'), up: redisUp },
    { label: t('health.workers.fetch'), up: (control.workers?.fetch ?? 0) > 0 },
    { label: t('health.workers.promote'), up: (control.workers?.promote ?? 0) > 0 },
    { label: t('health.workers.backlog'), up: (control.workers?.backlog ?? 0) > 0 },
  ]

  const queueRows = control.queues
    ? [
        { key: 'fetch', counts: control.queues.fetch },
        { key: 'promote', counts: control.queues.promote },
      ]
    : []

  return (
    <div className="ing">
      <section className={`ing-hero ing-hero--${state}`} aria-labelledby="ing-state">
        <div className="ing-hero__main">
          <div className="ing-hero__status">
            <span className="ing-dot" aria-hidden="true" />
            <h2 id="ing-state" className="ing-hero__state">
              {t(`state.${state}`)}
            </h2>
          </div>
          <p className="ing-hero__hint text-secondary">{t(`stateHint.${state}`)}</p>

          <div
            className="ing-progress"
            role="progressbar"
            aria-label={t('stats.coverage')}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <div className="ing-progress__track">
              <span className="ing-progress__fill" style={{ width: `${percent}%` }} />
            </div>
            <div className="ing-progress__meta">
              <strong>{percent}%</strong>
              <span className="text-secondary">
                {t('stats.coverageDetail', {
                  seeded: status.coverage.seeded,
                  planned: status.coverage.planned,
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="ing-hero__switch">
          <span className="ing-hero__switch-label">{t('crawl.label')}</span>
          <button
            type="button"
            role="switch"
            aria-checked={control.backlogEnabled}
            aria-label={t('crawl.label')}
            disabled={pending}
            onClick={() =>
              perform(
                () => setIngestionBacklogAction(!control.backlogEnabled),
                () => (control.backlogEnabled ? t('crawl.turnedOff') : t('crawl.turnedOn')),
              )
            }
            className="publish-switch"
          >
            <span className="publish-switch__knob" />
          </button>
          <span className="text-secondary ing-hero__switch-state">
            {control.backlogEnabled ? t('crawl.on') : t('crawl.off')}
          </span>
        </div>

        <div className="ing-hero__footer">
          <ul className="ing-chips" aria-label={t('health.title')}>
            {chips.map((chip) => (
              <li
                key={chip.label}
                className={`ing-chip ${chip.up ? 'ing-chip--up' : 'ing-chip--down'}`}
              >
                <span className="ing-chip__dot" aria-hidden="true" />
                {chip.label}
                <span className="sr-only">
                  {chip.up ? t('health.upLabel') : t('health.downLabel')}
                </span>
              </li>
            ))}
          </ul>
          <dl className="ing-meta">
            <div>
              <dt className="text-secondary">{t('health.lastTick')}</dt>
              <dd>
                {control.lastTick ? (
                  <>
                    {when(control.lastTick.at)}
                    <span className="text-secondary">
                      {' '}
                      · {describeTick(control.lastTick.result)}
                    </span>
                  </>
                ) : (
                  t('health.never')
                )}
              </dd>
            </div>
            <div>
              <dt className="text-secondary">{t('health.nextTick')}</dt>
              <dd>{control.nextTickAt ? when(control.nextTickAt) : t('health.never')}</dd>
            </div>
          </dl>
        </div>
      </section>

      <div aria-live="polite">
        {notice ? (
          <p
            className={`form-banner ${notice.kind === 'error' ? 'form-banner--error' : 'form-banner--success'}`}
            role={notice.kind === 'error' ? 'alert' : 'status'}
          >
            {notice.text}
          </p>
        ) : null}
      </div>

      <div className="stat-grid ing-stats">
        <StatCard
          label={t('stats.activeTiles')}
          value={activeTiles(status)}
          trend={t('stats.activeTilesDetail', { fetched: status.tiles['FETCHED'] ?? 0 })}
          icon={Loader}
          tone="primary"
        />
        <StatCard
          label={t('stats.failedTiles')}
          value={failedTiles}
          trend={failedTiles > 0 ? t('stats.failedHint') : t('stats.failedNone')}
          icon={AlertTriangle}
          tone={failedTiles > 0 ? 'warning' : 'success'}
          index={1}
        />
        <StatCard
          label={t('stats.rawPending')}
          value={status.rawPlaces['PENDING'] ?? 0}
          trend={t('stats.rawSkipped', { skipped: status.rawPlaces['SKIPPED'] ?? 0 })}
          icon={Inbox}
          tone="neutral"
          index={2}
        />
        <StatCard
          label={t('stats.live')}
          value={status.facilities.published}
          trend={t('stats.held', { held: status.facilities.unpublished })}
          icon={MapPin}
          tone="success"
          index={3}
        />
      </div>

      <div className="ing-split">
        <section className="panel-card">
          <div className="panel-card__header">
            <h2 className="panel-card__title">{t('queues.title')}</h2>
          </div>
          {queueRows.length > 0 ? (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('queues.queue')}</th>
                    <th>{t('queues.waiting')}</th>
                    <th>{t('queues.active')}</th>
                    <th>{t('queues.delayed')}</th>
                    <th>{t('queues.failed')}</th>
                  </tr>
                </thead>
                <tbody>
                  {queueRows.map(({ key, counts }) => (
                    <tr key={key}>
                      <td>{t(`queues.names.${key}`)}</td>
                      <td>{counts.waiting}</td>
                      <td>{counts.active}</td>
                      <td>{counts.delayed}</td>
                      <td className={counts.failed > 0 ? 'ing-bad' : undefined}>{counts.failed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-secondary">{t('queues.unavailable')}</p>
          )}
        </section>

        <section className="panel-card">
          <div className="panel-card__header">
            <div>
              <h2 className="panel-card__title">{t('naming.title')}</h2>
              <p className="panel-card__subtitle text-secondary">
                {t('naming.description', { total: namedTotal })}
              </p>
            </div>
          </div>
          <ul className="ing-bars">
            {NAMING_LAYERS.map((layer) => {
              const count = status.naming[layer] ?? 0
              const share = namedTotal > 0 ? Math.round((count / namedTotal) * 100) : 0
              return (
                <li key={layer} className="ing-bars__row">
                  <span className="ing-bars__label">{t(`naming.layers.${layer}`)}</span>
                  <span className="ing-bars__track" aria-hidden="true">
                    <span
                      className={`ing-bars__fill${layer === 'none' ? ' ing-bars__fill--muted' : ''}`}
                      style={{ width: `${share}%` }}
                    />
                  </span>
                  <span className="ing-bars__count">{count}</span>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <section aria-labelledby="ing-actions">
        <h2 id="ing-actions" className="ing-section-title">
          {t('actions.title')}
        </h2>
        <p className="text-secondary ing-section-hint">{t('actions.description')}</p>
        <div className="ing-actions">
          <article className="ing-action">
            <span className="stat-card__icon stat-card__icon--primary" aria-hidden="true">
              <DatabaseZap size={18} strokeWidth={2} />
            </span>
            <h3>{t('actions.promote')}</h3>
            <p className="text-secondary">{t('actions.promoteHint')}</p>
            <button
              type="button"
              className="btn btn--secondary"
              disabled={pending}
              onClick={() => perform(runPromotionAction, () => t('actions.queued'))}
            >
              {t('actions.run')}
            </button>
          </article>
          <article className="ing-action">
            <span className="stat-card__icon stat-card__icon--primary" aria-hidden="true">
              <Tags size={18} strokeWidth={2} />
            </span>
            <h3>{t('actions.reclassify')}</h3>
            <p className="text-secondary">{t('actions.reclassifyHint')}</p>
            <button
              type="button"
              className="btn btn--secondary"
              disabled={pending}
              onClick={() => perform(runReclassifyAction, () => t('actions.queued'))}
            >
              {t('actions.run')}
            </button>
          </article>
          <article className="ing-action">
            <span className="stat-card__icon stat-card__icon--warning" aria-hidden="true">
              <RefreshCw size={18} strokeWidth={2} />
            </span>
            <h3>{t('actions.retry')}</h3>
            <p className="text-secondary">{t('actions.retryHint')}</p>
            <button
              type="button"
              className="btn btn--secondary"
              disabled={pending || failedTiles === 0}
              onClick={() =>
                perform(retryFailedTilesAction, (result) =>
                  t('actions.retried', {
                    retried: result.retried ?? 0,
                    remaining: result.remaining ?? 0,
                  }),
                )
              }
            >
              {t('actions.run')}
            </button>
          </article>
        </div>
      </section>

      <details className="panel-card ing-details" open={status.recentFailures.length > 0}>
        <summary>
          {t('failures.title')}
          <span className="text-secondary"> ({status.recentFailures.length})</span>
        </summary>
        {status.recentFailures.length === 0 ? (
          <p className="text-secondary">{t('failures.empty')}</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('failures.area')}</th>
                  <th>{t('failures.error')}</th>
                </tr>
              </thead>
              <tbody>
                {status.recentFailures.map((failure) => (
                  <tr key={`${failure.south}:${failure.west}:${failure.north}:${failure.east}`}>
                    <td>
                      {failure.south}, {failure.west} → {failure.north}, {failure.east}
                    </td>
                    <td>{failure.error ?? t('failures.unknown')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </details>
    </div>
  )
}
