'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { facilityFormSchema, VEHICLE_TYPE_OPTIONS } from '@/lib/facility-schema'
import { createFacilityAction, updateFacilityAction } from '@/lib/facility-actions'
import type { FacilityActionResult } from '@/lib/facility-actions'
import type { AdminFacility } from '@/lib/api'

interface Props {
  mode: 'create' | 'edit'
  facility?: AdminFacility
  isPlatformAdmin: boolean
}

const INITIAL_STATE: FacilityActionResult = { ok: true }

function SubmitButton({ mode }: { mode: 'create' | 'edit' }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn--primary" disabled={pending}>
      {pending ? 'Saving…' : mode === 'create' ? 'Create facility' : 'Save changes'}
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

export function FacilityForm({ mode, facility, isPlatformAdmin }: Props) {
  const boundAction =
    mode === 'edit' && facility
      ? updateFacilityAction.bind(null, facility.id)
      : createFacilityAction

  const [state, formAction, isPending] = useActionState(boundAction, INITIAL_STATE)

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
    }
  }

  const is24h = facility?.openingHours.is24h ?? false

  return (
    <div className="card facility-form-card">
      {state && !state.ok ? (
        <p className="auth-alert" role="alert">
          {state.error}
        </p>
      ) : null}
      {state && state.ok && mode === 'edit' && !isPending ? (
        <p className="form-success" role="status">
          Changes saved.
        </p>
      ) : null}

      <form action={formAction} onSubmit={handleSubmit} noValidate>
        <div className="field-grid">
          <label className="field">
            <span className="field__label">Name</span>
            <input
              className="input"
              type="text"
              name="name"
              defaultValue={facility?.name ?? ''}
              required
              disabled={isPending}
            />
          </label>
          <label className="field">
            <span className="field__label">Address</span>
            <input
              className="input"
              type="text"
              name="address"
              defaultValue={facility?.address ?? ''}
              required
              disabled={isPending}
            />
          </label>
        </div>

        <div className="field-grid">
          <label className="field">
            <span className="field__label">Latitude</span>
            <input
              className="input"
              type="number"
              name="lat"
              step="any"
              defaultValue={facility?.lat ?? ''}
              required
              disabled={isPending}
            />
          </label>
          <label className="field">
            <span className="field__label">Longitude</span>
            <input
              className="input"
              type="number"
              name="lng"
              step="any"
              defaultValue={facility?.lng ?? ''}
              required
              disabled={isPending}
            />
          </label>
        </div>

        <div className="field-grid">
          <label className="field">
            <span className="field__label">Total capacity</span>
            <input
              className="input"
              type="number"
              name="totalCapacity"
              min="1"
              defaultValue={facility?.totalCapacity ?? ''}
              required
              disabled={isPending}
            />
          </label>
          <label className="field">
            <span className="field__label">Online quota</span>
            <input
              className="input"
              type="number"
              name="onlineQuota"
              min="0"
              defaultValue={facility?.onlineQuota ?? ''}
              required
              disabled={isPending}
            />
          </label>
        </div>

        <div className="field">
          <span className="field__label">Vehicle types</span>
          <div className="checkbox-group">
            {VEHICLE_TYPE_OPTIONS.map(({ value, label }) => (
              <label key={value} className="checkbox-label">
                <input
                  type="checkbox"
                  name="vehicleTypes"
                  value={value}
                  defaultChecked={facility ? facility.vehicleTypes.includes(value) : value === 'car'}
                  disabled={isPending}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="field-grid">
          <label className="field">
            <span className="field__label">Height restriction (cm, optional)</span>
            <input
              className="input"
              type="number"
              name="heightRestrictionCm"
              min="1"
              defaultValue={facility?.heightRestrictionCm ?? ''}
              disabled={isPending}
            />
          </label>
          <label className="field">
            <span className="field__label">Amenities (comma-separated)</span>
            <input
              className="input"
              type="text"
              name="amenities"
              defaultValue={facility?.amenities.join(', ') ?? ''}
              disabled={isPending}
            />
          </label>
        </div>

        <label className="field">
          <span className="field__label">Cancellation policy</span>
          <textarea
            className="input input--textarea"
            name="cancellationPolicy"
            rows={3}
            defaultValue={facility?.cancellationPolicy ?? ''}
            disabled={isPending}
          />
        </label>

        <div className="field">
          <span className="field__label">Opening hours</span>
          <div className="opening-hours-row">
            <label className="checkbox-label">
              <input
                type="hidden"
                name="is24h"
                value="false"
              />
              <input
                type="checkbox"
                onChange={(e) => {
                  const form = e.currentTarget.form
                  if (!form) return
                  const hidden = form.querySelector<HTMLInputElement>('input[name="is24h"]')
                  if (hidden) hidden.value = e.currentTarget.checked ? 'true' : 'false'
                  const timeFields = form.querySelectorAll<HTMLInputElement>('.opening-hours-time')
                  timeFields.forEach((f) => { f.disabled = e.currentTarget.checked })
                }}
                defaultChecked={is24h}
                disabled={isPending}
              />
              Open 24 hours
            </label>
            <label className="field opening-hours-time-field">
              <span className="field__label">Opens</span>
              <input
                className="input opening-hours-time"
                type="time"
                name="openTime"
                defaultValue={prefillOpenTime(facility)}
                disabled={isPending || is24h}
              />
            </label>
            <label className="field opening-hours-time-field">
              <span className="field__label">Closes</span>
              <input
                className="input opening-hours-time"
                type="time"
                name="closeTime"
                defaultValue={prefillCloseTime(facility)}
                disabled={isPending || is24h}
              />
            </label>
          </div>
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
              Active (visible to customers)
            </label>
          </div>
        ) : null}

        {mode === 'create' && isPlatformAdmin ? (
          <label className="field">
            <span className="field__label">Operator ID</span>
            <input
              className="input"
              type="text"
              name="operatorId"
              disabled={isPending}
            />
          </label>
        ) : null}

        <div className="form-actions">
          <SubmitButton mode={mode} />
        </div>
      </form>
    </div>
  )
}
