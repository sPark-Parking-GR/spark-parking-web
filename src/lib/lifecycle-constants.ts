export const LIFECYCLE_RESOURCE_TYPES = ['user', 'operator', 'facility', 'tariff-plan'] as const
export type LifecycleResourceType = (typeof LIFECYCLE_RESOURCE_TYPES)[number]

// The statuses the trash filter UI offers. The API's default (no status filter) also
// surfaces PURGED users — anonymised in place rather than deleted, unlike the other three
// resource types — which is why LifecycleItemStatus admits one more value than this
// filterable set.
export const LIFECYCLE_STATUSES = ['ARCHIVED', 'TOMBSTONED'] as const
export type LifecycleStatus = (typeof LIFECYCLE_STATUSES)[number]
export type LifecycleItemStatus = LifecycleStatus | 'PURGED'

export const LIFECYCLE_DESTRUCTIVE_ACTIONS = ['archive', 'tombstone', 'purge'] as const
export type LifecycleDestructiveAction = (typeof LIFECYCLE_DESTRUCTIVE_ACTIONS)[number]
