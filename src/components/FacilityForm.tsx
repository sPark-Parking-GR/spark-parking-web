'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { facilityFormSchema, VEHICLE_TYPE_OPTIONS } from '@/lib/facility-schema'
import { createFacilityAction, updateFacilityAction } from '@/lib/facility-actions'
import type { FacilityActionResult } from '@/lib/facility-actions'
import type { AdminFacility, FacilityTariffAssignment, FacilityTariffPlan } from '@/lib/api'
import { FacilityLocationPicker } from '@/components/FacilityLocationPicker'
import { MultiSelectControl } from '@/components/MultiSelectControl'
import { VEHICLE_ICON } from '@/components/vehicle-icons'
import { DateTimePicker } from '@/components/pickers/DateTimePicker'
import { FacilityTariffPanel } from '@/components/FacilityTariffPanel'

const VEHICLE_OPTIONS = VEHICLE_TYPE_OPTIONS.map((o) => ({ ...o, icon: VEHICLE_ICON[o.value] }))

interface TariffProps {
  facilityId: string
  assignments: FacilityTariffAssignment[]
  defaultPlan: { id: string; name: string } | null
  tariffPlans: FacilityTariffPlan[]
}

interface Props {
  mode: 'create' | 'edit'
  facility?: AdminFacility
  isPlatformAdmin: boolean
  tariff?: TariffProps
}

const INITIAL_STATE: FacilityActionResult = { ok: true }

function SubmitButton({ mode }: { mode: 'create' | 'edit' }) {
  const t = useTranslations('facilities')
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--primary" disabled={pending}>
      {pending ? t('form.saving') : mode === 'create' ? t('form.createFacility') : t('form.saveChanges')}
    </button>
  )
}

function prefillOpenTime(facility?: AdminFacility): string {
  if (!facility) return '08:00'
  if (facility.openingHours.is24h) return '00:00'
  const schedule = facility.openingHours.schedule
  if (!schedule) return '08:00'
  const first = Object.values(schedule).find(Boolean)
  return first ? first.open : '08:00'
}

function prefillCloseTime(facility?: AdminFacility): string {
  if (!facility) return '20:00'
  if (facility.openingHours.is24h) return '00:00'
  const schedule = facility.openingHours.schedule
  if (!schedule) return '20:00'
  const first = Object.values(schedule).find(Boolean)
  return first ? first.close : '20:00'
}

export function FacilityForm({ mode, facility, isPlatformAdmin, tariff }: Props) {
  const t = useTranslations('facilities')
  const boundAction =
    mode === 'edit' && facility
      ? updateFacilityAction.bind(null, facility.id)
      : createFacilityAction

  const [state, formAction, isPending] = useActionState(boundAction, INITIAL_STATE)

  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [name, setName] = useState(() => facility?.name ?? '')
  const [address, setAddress] = useState(() => facility?.address ?? '')
  const [totalCapacity, setTotalCapacity] = useState(() =>
    facility?.totalCapacity != null ? String(facility.totalCapacity) : '',
  )
  const [onlineQuota, setOnlineQuota] = useState(() =>
    facility?.onlineQuota != null ? String(facility.onlineQuota) : '',
  )
  const [heightRestrictionCm, setHeightRestrictionCm] = useState(() =>
    facility?.heightRestrictionCm != null ? String(facility.heightRestrictionCm) : '',
  )
  const [amenities, setAmenities] = useState(() => facility?.amenities.join(', ') ?? '')
  const [cancellationPolicy, setCancellationPolicy] = useState(
    () => facility?.cancellationPolicy ?? '',
  )
  const [operatorId, setOperatorId] = useState('')
  const [lat, setLat] = useState<number | null>(facility?.lat ?? null)
  const [lng, setLng] = useState<number | null>(facility?.lng ?? null)
  const [vehicleTypes, setVehicleTypes] = useState<string[]>(
    () => facility?.vehicleTypes ?? ['car'],
  )
  const [is24h, setIs24h] = useState(() => facility?.openingHours.is24h ?? false)
  const [openTime, setOpenTime] = useState(() => prefillOpenTime(facility))
  const [closeTime, setCloseTime] = useState(() => prefillCloseTime(facility))

  const parseCoord = (value: string): number | null => {
    if (value.trim() === '') return null
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget)
    const raw = {
      name: fd.get('name'),
      address: fd.get('address'),
      lat: fd.get('lat'),
      lng: fd.get('lng'),
      totalCapacity: fd.get('totalCapacity'),
      onlineQuota: fd.get('onlineQuota'),
      vehicleTypes: fd.getAll('vehicleTypes'),
      heightRestrictionCm: fd.get('heightRestrictionCm') || null,
      amenities: fd.get('amenities'),
      cancellationPolicy: fd.get('cancellationPolicy'),
      is24h: fd.get('is24h') === 'true',
      openTime: fd.get('openTime'),
      closeTime: fd.get('closeTime'),
      isActive: fd.get('isActive'),
      operatorId: fd.get('operatorId'),
    }
    const result = facilityFormSchema.safeParse(raw)
    if (!result.success) {
      e.preventDefault()
      return
    }
    setHasSubmitted(true)
  }

  const showVisibilitySection =
    mode === 'edit' || (mode === 'create' && isPlatformAdmin)

  return (
    <div className="facility-form-layout">
      <form action={formAction} onSubmit={handleSubmit} noValidate className="facility-form-card">
        {state && !state.ok ? (
          <p className="form-banner form-banner--error" role="alert">
            <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
            {state.error}
          </p>
        ) : null}
        {state && state.ok && mode === 'edit' && hasSubmitted && !isPending ? (
          <p className="form-banner form-banner--success" role="status">
            <CheckCircle2 size={18} strokeWidth={2} aria-hidden="true" />
            {t('form.changesSaved')}
          </p>
        ) : null}

        {tariff ? (
          <FacilityTariffPanel
            facilityId={tariff.facilityId}
            assignments={tariff.assignments}
            defaultPlan={tariff.defaultPlan}
            tariffPlans={tariff.tariffPlans}
          />
        ) : null}

        <section className="editor-section card">
          <div className="editor-section__head">
            <h3 className="h-heading">{t('form.basics')}</h3>
          </div>
          <div className="field-grid">
            <label className="field">
              <span className="field__label">{t('form.nameLabel')}</span>
              <input
                className="input"
                type="text"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isPending}
              />
            </label>
            <label className="field">
              <span className="field__label">{t('form.addressLabel')}</span>
              <input
                className="input"
                type="text"
                name="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                disabled={isPending}
              />
            </label>
          </div>
        </section>

        <section className="editor-section card">
          <div className="editor-section__head">
            <h3 className="h-heading">{t('form.location')}</h3>
            <p className="editor-section__hint">{t('form.locationHint')}</p>
          </div>
          <div className="field-grid">
            <label className="field">
              <span className="field__label">{t('form.latitudeLabel')}</span>
              <input
                className="input"
                type="number"
                name="lat"
                step="any"
                value={lat ?? ''}
                onChange={(e) => setLat(parseCoord(e.target.value))}
                required
                disabled={isPending}
              />
            </label>
            <label className="field">
              <span className="field__label">{t('form.longitudeLabel')}</span>
              <input
                className="input"
                type="number"
                name="lng"
                step="any"
                value={lng ?? ''}
                onChange={(e) => setLng(parseCoord(e.target.value))}
                required
                disabled={isPending}
              />
            </label>
          </div>
        </section>

        <section className="editor-section card">
          <div className="editor-section__head">
            <h3 className="h-heading">{t('form.capacityVehicles')}</h3>
          </div>
          <div className="field-grid">
            <label className="field">
              <span className="field__label">{t('form.totalCapacityLabel')}</span>
              <input
                className="input"
                type="number"
                name="totalCapacity"
                min="1"
                value={totalCapacity}
                onChange={(e) => setTotalCapacity(e.target.value)}
                required
                disabled={isPending}
              />
            </label>
            <label className="field">
              <span className="field__label">{t('form.onlineQuotaLabel')}</span>
              <input
                className="input"
                type="number"
                name="onlineQuota"
                min="0"
                value={onlineQuota}
                onChange={(e) => setOnlineQuota(e.target.value)}
                required
                disabled={isPending}
              />
            </label>
          </div>

          <div className="field">
            <span className="field__label">{t('form.vehicleTypesLabel')}</span>
            <MultiSelectControl
              options={VEHICLE_OPTIONS}
              value={vehicleTypes}
              onChange={setVehicleTypes}
              disabled={isPending}
            />
            {vehicleTypes.map((value) => (
              <input key={value} type="hidden" name="vehicleTypes" value={value} />
            ))}
          </div>

          <label className="field">
            <span className="field__label">{t('form.heightRestrictionLabel')}</span>
            <input
              className="input"
              type="number"
              name="heightRestrictionCm"
              min="1"
              value={heightRestrictionCm}
              onChange={(e) => setHeightRestrictionCm(e.target.value)}
              disabled={isPending}
            />
          </label>
        </section>

        <section className="editor-section card">
          <div className="editor-section__head">
            <h3 className="h-heading">{t('form.policyAmenities')}</h3>
          </div>
          <label className="field">
            <span className="field__label">{t('form.amenitiesLabel')}</span>
            <input
              className="input"
              type="text"
              name="amenities"
              value={amenities}
              onChange={(e) => setAmenities(e.target.value)}
              disabled={isPending}
            />
          </label>
          <label className="field">
            <span className="field__label">{t('form.cancellationPolicyLabel')}</span>
            <textarea
              className="input input--textarea"
              name="cancellationPolicy"
              rows={3}
              value={cancellationPolicy}
              onChange={(e) => setCancellationPolicy(e.target.value)}
              disabled={isPending}
            />
          </label>
        </section>

        <section className="editor-section card">
          <div className="editor-section__head">
            <h3 className="h-heading">{t('form.openingHours')}</h3>
          </div>
          <input type="hidden" name="is24h" value={is24h ? 'true' : 'false'} />
          <div className="opening-hours-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={is24h}
                onChange={(e) => setIs24h(e.target.checked)}
                disabled={isPending}
              />
              {t('form.open24h')}
            </label>
            <div className="field opening-hours-time-field">
              <span className="field__label">{t('form.opens')}</span>
              <DateTimePicker
                mode="time"
                name="openTime"
                value={openTime}
                onChange={setOpenTime}
                disabled={isPending || is24h}
                ariaLabel={t('form.openingTimeAria')}
              />
            </div>
            <div className="field opening-hours-time-field">
              <span className="field__label">{t('form.closes')}</span>
              <DateTimePicker
                mode="time"
                name="closeTime"
                value={closeTime}
                onChange={setCloseTime}
                disabled={isPending || is24h}
                ariaLabel={t('form.closingTimeAria')}
              />
            </div>
          </div>
        </section>

        {showVisibilitySection ? (
          <section className="editor-section card">
            <div className="editor-section__head">
              <h3 className="h-heading">{t('form.visibility')}</h3>
            </div>
            {mode === 'edit' ? (
              <div className="field">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    value="true"
                    defaultChecked={facility?.isActive ?? false}
                    disabled={isPending}
                  />
                  {t('form.activeVisible')}
                </label>
              </div>
            ) : null}

            {mode === 'create' && isPlatformAdmin ? (
              <label className="field">
                <span className="field__label">{t('form.operatorIdLabel')}</span>
                <input
                  className="input"
                  type="text"
                  name="operatorId"
                  value={operatorId}
                  onChange={(e) => setOperatorId(e.target.value)}
                  placeholder={t('form.operatorIdPlaceholder')}
                  disabled={isPending}
                />
                <span className="editor-section__hint">{t('form.operatorIdHint')}</span>
              </label>
            ) : null}
          </section>
        ) : null}

        <div className="form-actions">
          <SubmitButton mode={mode} />
        </div>
      </form>

      <aside className="facility-map-panel">
        <FacilityLocationPicker
          lat={lat}
          lng={lng}
          onChange={(nextLat, nextLng) => {
            setLat(nextLat)
            setLng(nextLng)
          }}
        />
        <p className="facility-map__hint">{t('form.mapHint')}</p>
      </aside>
    </div>
  )
}
