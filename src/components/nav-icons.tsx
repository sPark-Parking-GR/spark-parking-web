import {
  LayoutDashboard,
  Building2,
  Receipt,
  CalendarClock,
  ScanLine,
  UserPlus,
  BarChart3,
  ScrollText,
  Trash2,
  ShieldCheck,
  ShieldPlus,
  Store,
  Users,
  UsersRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { NavIcon } from '@/lib/nav'

export const NAV_ICONS: Record<NavIcon, LucideIcon> = {
  overview: LayoutDashboard,
  facilities: Building2,
  tariffs: Receipt,
  bookings: CalendarClock,
  scan: ScanLine,
  team: UsersRound,
  operatorDirectory: Store,
  onboarding: UserPlus,
  analytics: BarChart3,
  audit: ScrollText,
  trash: Trash2,
  approvals: ShieldCheck,
  users: Users,
  admins: ShieldPlus,
}
