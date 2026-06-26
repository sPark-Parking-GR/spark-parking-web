import {
  LayoutDashboard,
  Building2,
  Receipt,
  CalendarClock,
  Users,
  BarChart3,
  ScrollText,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { NavIcon } from '@/lib/nav'

export const NAV_ICONS: Record<NavIcon, LucideIcon> = {
  overview: LayoutDashboard,
  facilities: Building2,
  tariffs: Receipt,
  bookings: CalendarClock,
  operators: Users,
  analytics: BarChart3,
  audit: ScrollText,
}
