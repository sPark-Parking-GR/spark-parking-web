import Link from 'next/link'
import type { TariffPlanListItem } from '@/lib/tariff-api'

interface Props {
  items: TariffPlanListItem[]
}

function formatValidity(from: string | null, to: string | null): string {
  if (!from && !to) return 'Always'
  const fmt = (iso: string) => new Date(iso).toLocaleDateString()
  if (from && to) return `${fmt(from)} – ${fmt(to)}`
  if (from) return `From ${fmt(from)}`
  return `Until ${fmt(to as string)}`
}

export function TariffPlanTable({ items }: Props) {
  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Vehicles</th>
            <th>Validity</th>
            <th>Version</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <Link href={`/dashboard/tariffs/${item.id}`} className="table-link">
                  {item.name}
                </Link>
                {item.isDefault ? <span className="badge badge--info">Default</span> : null}
              </td>
              <td>
                {item.isActive ? (
                  <span className="badge badge--success">Active</span>
                ) : (
                  <span className="badge badge--neutral">Inactive</span>
                )}
              </td>
              <td className="text-secondary">{item.vehicleTypes.join(', ')}</td>
              <td className="text-secondary">{formatValidity(item.validFrom, item.validTo)}</td>
              <td>v{item.version}</td>
              <td className="text-secondary">{new Date(item.updatedAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
