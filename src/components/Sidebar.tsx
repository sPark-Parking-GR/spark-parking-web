import { NavLink } from '@/components/NavLink'
import type { NavItem } from '@/lib/nav'

export function Sidebar({ items }: { items: NavItem[] }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="brand">sPark</span>
        <span className="brand__tag">Admin</span>
      </div>
      <nav className="sidebar__nav" aria-label="Primary">
        {items.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>
    </aside>
  )
}
