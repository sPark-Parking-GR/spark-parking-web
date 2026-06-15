'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useRef, useState } from 'react'
import { confirmBooking, createBooking } from '../lib/api'
import { Button, Card, Field, inputClass } from './ui'

export function CheckoutClient() {
  const router = useRouter()
  const params = useSearchParams()
  const idempotencyKey = useRef<string>(crypto.randomUUID())

  const facilityId = params.get('facilityId')
  const name = params.get('name')
  const startsAt = params.get('startsAt')
  const endsAt = params.get('endsAt')
  const vehicleType = params.get('vehicleType')

  const [plate, setPlate] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ready = facilityId && startsAt && endsAt && vehicleType

  async function submit() {
    if (!ready) {
      setError('Λείπουν στοιχεία κράτησης')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const booking = await createBooking(
        {
          facilityId: facilityId!,
          startsAt: startsAt!,
          endsAt: endsAt!,
          vehicleType: vehicleType!,
          vehiclePlate: plate.trim().toUpperCase(),
          guestEmail: email.trim(),
          guestPhone: phone.trim() || undefined,
        },
        idempotencyKey.current,
      )
      await confirmBooking(booking.bookingId)
      router.push(`/booking/${booking.bookingId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Η κράτηση απέτυχε')
      setLoading(false)
    }
  }

  return (
    <Card>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginTop: 0, marginBottom: 4 }}>Ολοκλήρωση κράτησης</h1>
      {name ? (
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 0, marginBottom: 20 }}>{name}</p>
      ) : null}

      <Field label="Πινακίδα οχήματος">
        <input
          className={inputClass}
          value={plate}
          onChange={(e) => setPlate(e.target.value)}
          placeholder="ΙΑΑ-1234"
        />
      </Field>
      <Field label="Email">
        <input
          className={inputClass}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </Field>
      <Field label="Τηλέφωνο (προαιρετικό)">
        <input
          className={inputClass}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </Field>

      {error ? (
        <p style={{ color: 'var(--color-error)', fontSize: 14, marginBottom: 12 }}>{error}</p>
      ) : null}

      <Button fullWidth disabled={loading || !plate || !email} onClick={submit}>
        {loading ? 'Επεξεργασία…' : 'Πληρωμή & κράτηση'}
      </Button>
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 12, marginBottom: 0 }}>
        Λειτουργία ανάπτυξης: πληρωμή μέσω mock provider.
      </p>
    </Card>
  )
}
