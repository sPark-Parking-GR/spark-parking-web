'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { ApiError, AuthRequiredError } from './api'
import { checkInBooking, checkOutBooking } from './booking-api'

const BOOKINGS_PATH = '/dashboard/bookings'

export type BookingActionResult = { ok: true } | { ok: false; error: string }

function mapApiError(err: unknown): BookingActionResult {
  if (err instanceof AuthRequiredError) {
    redirect('/login')
  }
  if (err instanceof ApiError) {
    if (err.status === 403) return { ok: false, error: 'You are not allowed to manage this booking.' }
    if (err.status === 404) return { ok: false, error: 'Booking not found.' }
    if (err.status === 409) {
      return { ok: false, error: 'Booking is no longer in a state that allows this action.' }
    }
  }
  return { ok: false, error: 'Something went wrong. Please try again.' }
}

export async function checkInAction(formData: FormData): Promise<BookingActionResult> {
  const id = String(formData.get('id') ?? '')
  if (!id) return { ok: false, error: 'Missing booking id.' }

  try {
    await checkInBooking(id)
  } catch (err) {
    return mapApiError(err)
  }

  revalidatePath(BOOKINGS_PATH)
  return { ok: true }
}

export async function checkOutAction(formData: FormData): Promise<BookingActionResult> {
  const id = String(formData.get('id') ?? '')
  if (!id) return { ok: false, error: 'Missing booking id.' }

  try {
    await checkOutBooking(id)
  } catch (err) {
    return mapApiError(err)
  }

  revalidatePath(BOOKINGS_PATH)
  return { ok: true }
}
