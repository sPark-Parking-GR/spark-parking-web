import Link from 'next/link'
import type { AdminFacilityListItem } from '@/lib/api'

interface Props {
  items: AdminFacilityListItem[]
}

export function FacilityTable({ items }: Props) {
  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Address</th>
            <th>Capacity</th>
            <th>Status</th>
            <th>Verified</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <Link href={`/dashboard/facilities/${item.id}`} className="table-link">
                  {item.name}
                </Link>
              </td>
              <td className="text-secondary">{item.address}</td>
              <td>
                {item.onlineQuota}/{item.totalCapacity}
              </td>
              <td>
                {item.isActive ? (
                  <span className="badge badge--success">Active</span>
                ) : (
                  <span className="badge badge--neutral">Inactive</span>
                )}
              </td>
              <td>
                {item.isVerified ? (
                  <span className="badge badge--success">Verified</span>
                ) : (
                  <span className="badge badge--warning">Pending</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
