import { NavLink } from '@/components/NavLink'
import { SparkLogo } from '@/components/SparkLogo'
import type { NavItem } from '@/lib/nav'

export function Sidebar({ items }: { items: NavItem[] }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <SparkLogo label="Admin" onInk gradientId="spark-sidebar-grad" />
      </div>
      <nav className="sidebar__nav" aria-label="Primary">
        {items.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>
    </aside>
  )
}
