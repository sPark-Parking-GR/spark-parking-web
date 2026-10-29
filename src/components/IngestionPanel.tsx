'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useFormatter, useTranslations } from 'next-intl'
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
import type { BacklogTickResult, IngestionStatus, QueueCounts } from '@/lib/ingestion-types'
import { StatCard } from './StatCard'

const REFRESH_MS = 15_000

const STATE_BADGE = {
  unavailable: 'badge--error',
  offline: 'badge--error',
  off: 'badge--neutral',
  finished: 'badge--success',
  running: 'badge--success',
} as const

export function IngestionPanel({ status }: { status: IngestionStatus }) {
  const t = useTranslations('ingestion')
  const format = useFormatter()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

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
  const rawPending = status.rawPlaces['PENDING'] ?? 0
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

  const queueLine = (counts: QueueCounts) =>
    t('health.queueCounts', {
      waiting: counts.waiting,
      active: counts.active,
      delayed: counts.delayed,
      failed: counts.failed,
    })

  return (
    <div className="ingestion-panel">
      <div className="panel-card">
        <div className="panel-card__header">
          <div>
            <h2 className="panel-card__title">
              {t('crawl.label')}{' '}
              <span className={`badge ${STATE_BADGE[state]}`}>{t(`state.${state}`)}</span>
            </h2>
            <p className="panel-card__subtitle text-secondary">{t('crawl.description')}</p>
          </div>
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
        </div>
        <div className="panel-card__body">
          <p className="text-secondary">{t(`stateHint.${state}`)}</p>
          {notice ? (
            <p
              className={`form-banner ${notice.kind === 'error' ? 'form-banner--error' : 'form-banner--success'}`}
              role={notice.kind === 'error' ? 'alert' : 'status'}
            >
              {notice.text}
            </p>
          ) : null}
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          label={t('stats.coverage')}
          value={`${percent}%`}
          trend={t('stats.coverageDetail', {
            seeded: status.coverage.seeded,
            planned: status.coverage.planned,
          })}
          tone="primary"
        />
        <StatCard
          label={t('stats.activeTiles')}
          value={activeTiles(status)}
          trend={t('stats.activeTilesDetail', { fetched: status.tiles['FETCHED'] ?? 0 })}
          tone="neutral"
          index={1}
        />
        <StatCard
          label={t('stats.failedTiles')}
          value={failedTiles}
          tone={failedTiles > 0 ? 'warning' : 'success'}
          index={2}
        />
        <StatCard
          label={t('stats.rawPending')}
          value={rawPending}
          trend={t('stats.rawSkipped', { skipped: status.rawPlaces['SKIPPED'] ?? 0 })}
          tone="neutral"
          index={3}
        />
        <StatCard
          label={t('stats.live')}
          value={status.facilities.published}
          trend={t('stats.held', { held: status.facilities.unpublished })}
          tone="success"
          index={4}
        />
      </div>

      <div className="panel-card">
        <div className="panel-card__header">
          <h2 className="panel-card__title">{t('health.title')}</h2>
        </div>
        <div className="panel-card__body">
          {control.redis === 'unavailable' ? (
            <p className="form-banner form-banner--error" role="alert">
              {t('health.redisDown')}
            </p>
          ) : (
            <ul className="ingestion-panel__list">
              <li>
                {t('health.workers.fetch')}: {workerLabel(control.workers?.fetch ?? 0)}
                {control.queues ? ` · ${queueLine(control.queues.fetch)}` : ''}
              </li>
              <li>
                {t('health.workers.promote')}: {workerLabel(control.workers?.promote ?? 0)}
                {control.queues ? ` · ${queueLine(control.queues.promote)}` : ''}
              </li>
              <li>
                {t('health.workers.backlog')}: {workerLabel(control.workers?.backlog ?? 0)}
              </li>
              <li>
                {t('health.lastTick')}:{' '}
                {control.lastTick
                  ? `${when(control.lastTick.at)} — ${describeTick(control.lastTick.result)}`
                  : t('health.never')}
              </li>
              <li>
                {t('health.nextTick')}:{' '}
                {control.nextTickAt ? when(control.nextTickAt) : t('health.never')}
              </li>
            </ul>
          )}
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-card__header">
          <div>
            <h2 className="panel-card__title">{t('actions.title')}</h2>
            <p className="panel-card__subtitle text-secondary">{t('actions.description')}</p>
          </div>
        </div>
        <div className="panel-card__body ingestion-panel__actions">
          <div>
            <button
              type="button"
              className="btn btn--secondary"
              disabled={pending}
              onClick={() => perform(runPromotionAction, () => t('actions.queued'))}
            >
              {t('actions.promote')}
            </button>
            <p className="text-secondary">{t('actions.promoteHint')}</p>
          </div>
          <div>
            <button
              type="button"
              className="btn btn--secondary"
              disabled={pending}
              onClick={() => perform(runReclassifyAction, () => t('actions.queued'))}
            >
              {t('actions.reclassify')}
            </button>
            <p className="text-secondary">{t('actions.reclassifyHint')}</p>
          </div>
          <div>
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
              {t('actions.retry')}
            </button>
            <p className="text-secondary">{t('actions.retryHint')}</p>
          </div>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-card__header">
          <div>
            <h2 className="panel-card__title">{t('naming.title')}</h2>
            <p className="panel-card__subtitle text-secondary">
              {t('naming.description', { total: namingTotal(status.naming) })}
            </p>
          </div>
        </div>
        <div className="panel-card__body">
          <ul className="ingestion-panel__list">
            {NAMING_LAYERS.map((layer) => (
              <li key={layer}>
                {t(`naming.layers.${layer}`)}: {status.naming[layer] ?? 0}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-card__header">
          <h2 className="panel-card__title">{t('failures.title')}</h2>
        </div>
        <div className="panel-card__body">
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
        </div>
      </div>
    </div>
  )

  function workerLabel(count: number): string {
    return count > 0 ? t('health.online', { count }) : t('health.offline')
  }
}
