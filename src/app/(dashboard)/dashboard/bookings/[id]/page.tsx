import { notFound, redirect } from 'next/navigation'
import { BookingDetailView } from '@/components/BookingDetailView'
import { getBooking } from '@/lib/booking-api'
import { ApiError, AuthRequiredError } from '@/lib/api'
import { requireSession } from '@/lib/dal'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function BookingDetailPage({ params }: PageProps) {
  await requireSession()

  const { id } = await params

  let booking
  try {
    booking = await getBooking(id)
  } catch (err) {
    if (err instanceof AuthRequiredError) redirect('/login')
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) notFound()
    throw err
  }

  return <BookingDetailView booking={booking} backHref="/dashboard/bookings" />
}
