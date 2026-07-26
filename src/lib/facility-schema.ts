import { z } from 'zod'

const VEHICLE_TYPES = ['car', 'motorcycle', 'van', 'truck'] as const

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

// FormData reports an untouched number input as '' (not absent), which Number('') coerces
// to 0 — a silent Null Island default rather than a validation error. Normalize the empty
// string to undefined first so z.coerce's required check fires instead.
const emptyToUndefined = (v: unknown) => (v === '' || v === null ? undefined : v)

export const facilityFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required.'),
    address: z.string().trim().min(1, 'Address is required.'),
    // z.coerce runs before the required-vs-invalid-type check, turning a missing value into
    // NaN rather than leaving it undefined — so this always lands on invalid_type_error,
    // never required_error. Word it for the real cause: no pin placed yet.
    lat: z.preprocess(
      emptyToUndefined,
      z.coerce.number({ invalid_type_error: 'Set a location on the map.' }).min(-90).max(90),
    ),
    lng: z.preprocess(
      emptyToUndefined,
      z.coerce.number({ invalid_type_error: 'Set a location on the map.' }).min(-180).max(180),
    ),
    totalCapacity: z.coerce
      .number({ invalid_type_error: 'Total capacity must be a number.' })
      .int()
      .min(1, 'Total capacity must be at least 1.'),
    onlineQuota: z.coerce
      .number({ invalid_type_error: 'Online quota must be a number.' })
      .int()
      .min(0, 'Online quota must be 0 or greater.'),
    vehicleTypes: z
      .array(z.enum(VEHICLE_TYPES))
      .min(1, 'Select at least one vehicle type.'),
    heightRestrictionCm: z.coerce
      .number({ invalid_type_error: 'Height restriction must be a number.' })
      .int()
      .positive()
      .nullable()
      .optional(),
    amenities: z.string().optional(),
    cancellationPolicy: z.string().trim().optional(),
    is24h: z.coerce.boolean().optional(),
    openTime: z
      .string()
      .regex(timeRegex, 'Enter a valid open time (HH:MM).')
      .optional(),
    closeTime: z
      .string()
      .regex(timeRegex, 'Enter a valid close time (HH:MM).')
      .optional(),
    isActive: z.coerce.boolean().optional(),
    operatorId: z.string().trim().nullable().optional(),
  })
  .refine((d) => d.onlineQuota <= d.totalCapacity, {
    message: 'Online quota cannot exceed total capacity.',
    path: ['onlineQuota'],
  })

export type FacilityFormValues = z.infer<typeof facilityFormSchema>

export const VEHICLE_TYPE_OPTIONS: { value: (typeof VEHICLE_TYPES)[number]; label: string }[] = [
  { value: 'car', label: 'Car' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'van', label: 'Van' },
  { value: 'truck', label: 'Truck' },
]
