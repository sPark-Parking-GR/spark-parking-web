import {
  LayoutDashboard,
  Building2,
  Receipt,
  CalendarClock,
  Users,
  UserPlus,
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
  onboarding: UserPlus,
  analytics: BarChart3,
  audit: ScrollText,
}
