import { Bike, Car, Caravan, Truck, type LucideIcon } from 'lucide-react'
import type { VehicleType } from '@spark/types'

export const VEHICLE_ICON: Record<VehicleType, LucideIcon> = {
  car: Car,
  motorcycle: Bike,
  van: Caravan,
  truck: Truck,
}
