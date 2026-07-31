import { z } from 'zod'

const VEHICLE_TYPES = ['car', 'motorcycle', 'van', 'truck'] as const

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

// FormData reports an untouched number input as '' (not absent), which Number('') coerces
// to 0 — a silent Null Island default rather than a validation error. Normalize the empty
// string to undefined first so z.coerce's required check fires instead.
const emptyToUndefined = (v: unknown) => (v === '' || v === null ? undefined : v)

// A field the form did not render at all reads back as null from FormData, which an
// optional string schema would reject; '' is left alone so clearing a field still submits.
const nullToUndefined = (v: unknown) => (v === null ? undefined : v)

const totalCapacityField = z.coerce
  .number({ invalid_type_error: 'validation.totalCapacityInvalidType' })
  .int()
  .min(1, 'validation.totalCapacityMin')

const onlineQuotaField = z.coerce
  .number({ invalid_type_error: 'validation.onlineQuotaInvalidType' })
  .int()
  .min(0, 'validation.onlineQuotaMin')

const vehicleTypesField = z.array(z.enum(VEHICLE_TYPES))

const commonFields = {
  name: z.string().trim().min(1, 'validation.nameRequired'),
  address: z.string().trim().min(1, 'validation.addressRequired'),
  // z.coerce runs before the required-vs-invalid-type check, turning a missing value into
  // NaN rather than leaving it undefined — so this always lands on invalid_type_error,
  // never required_error. Word it for the real cause: no pin placed yet.
  lat: z.preprocess(
    emptyToUndefined,
    z.coerce.number({ invalid_type_error: 'validation.locationRequired' }).min(-90).max(90),
  ),
  lng: z.preprocess(
    emptyToUndefined,
    z.coerce.number({ invalid_type_error: 'validation.locationRequired' }).min(-180).max(180),
  ),
  heightRestrictionCm: z.coerce
    .number({ invalid_type_error: 'validation.heightRestrictionInvalidType' })
    .int()
    .positive()
    .nullable()
    .optional(),
  amenities: z.preprocess(nullToUndefined, z.string().optional()),
  cancellationPolicy: z.preprocess(nullToUndefined, z.string().trim().optional()),
  is24h: z.coerce.boolean().optional(),
  openTime: z.preprocess(
    nullToUndefined,
    z.string().regex(timeRegex, 'validation.openTimeInvalid').optional(),
  ),
  closeTime: z.preprocess(
    nullToUndefined,
    z.string().regex(timeRegex, 'validation.closeTimeInvalid').optional(),
  ),
  isActive: z.coerce.boolean().optional(),
  operatorId: z.string().trim().nullable().optional(),
}

const quotaWithinCapacity = {
  message: 'validation.onlineQuotaExceedsCapacity',
  path: ['onlineQuota'],
}

export const facilityFormSchema = z
  .object({
    ...commonFields,
    totalCapacity: totalCapacityField,
    onlineQuota: onlineQuotaField,
    vehicleTypes: vehicleTypesField.min(1, 'validation.vehicleTypesRequired'),
  })
  .refine((d) => d.onlineQuota <= d.totalCapacity, quotaWithinCapacity)

// Non-business facilities are catalog-only listings: they are never bookable, so the form
// omits the booking setup entirely and those fields must not be required here either.
const catalogFacilityFormSchema = z
  .object({
    ...commonFields,
    totalCapacity: z.preprocess(emptyToUndefined, totalCapacityField.optional()),
    onlineQuota: z.preprocess(emptyToUndefined, onlineQuotaField.optional()),
    vehicleTypes: vehicleTypesField.optional(),
  })
  .refine(
    (d) =>
      d.onlineQuota === undefined ||
      d.totalCapacity === undefined ||
      d.onlineQuota <= d.totalCapacity,
    quotaWithinCapacity,
  )

export function buildFacilityFormSchema(isBusiness: boolean) {
  return isBusiness ? facilityFormSchema : catalogFacilityFormSchema
}

export type FacilityFormValues = z.infer<ReturnType<typeof buildFacilityFormSchema>>

export const VEHICLE_TYPE_OPTIONS: { value: (typeof VEHICLE_TYPES)[number]; label: string }[] = [
  { value: 'car', label: 'Car' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'van', label: 'Van' },
  { value: 'truck', label: 'Truck' },
]
