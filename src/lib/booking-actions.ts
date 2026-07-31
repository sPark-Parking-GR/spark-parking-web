'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { ApiError, AuthRequiredError } from './api'
import { cancelBooking, checkInBooking, checkOutBooking } from './booking-api'

const BOOKINGS_PATH = '/dashboard/bookings'

export type BookingErrorKey =
  | 'forbidden'
  | 'notFound'
  | 'invalidState'
  | 'refundFailed'
  | 'genericError'
  | 'missingId'

export type BookingActionResult = { ok: true } | { ok: false; errorKey: BookingErrorKey }

function mapApiError(err: unknown): BookingActionResult {
  if (err instanceof AuthRequiredError) {
    redirect('/login')
  }
  if (err instanceof ApiError) {
    if (err.status === 403) return { ok: false, errorKey: 'forbidden' }
    if (err.status === 404) return { ok: false, errorKey: 'notFound' }
    if (err.status === 409) {
      return { ok: false, errorKey: 'invalidState' }
    }
    // Refund call to the payment provider failed after the intent was durably recorded
    // (booking left REFUND_PENDING): retryable, so surface it distinctly from a hard failure.
    if (err.status === 502) {
      return { ok: false, errorKey: 'refundFailed' }
    }
  }
  return { ok: false, errorKey: 'genericError' }
}

export async function checkInAction(formData: FormData): Promise<BookingActionResult> {
  const id = String(formData.get('id') ?? '')
  if (!id) return { ok: false, errorKey: 'missingId' }

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
  if (!id) return { ok: false, errorKey: 'missingId' }

  try {
    await checkOutBooking(id)
  } catch (err) {
    return mapApiError(err)
  }

  revalidatePath(BOOKINGS_PATH)
  return { ok: true }
}

export async function cancelBookingAction(formData: FormData): Promise<BookingActionResult> {
  const id = String(formData.get('id') ?? '')
  if (!id) return { ok: false, errorKey: 'missingId' }

  try {
    await cancelBooking(id)
  } catch (err) {
    return mapApiError(err)
  }

  revalidatePath(BOOKINGS_PATH)
  revalidatePath(`${BOOKINGS_PATH}/${id}`)
  return { ok: true }
}
