'use client'

import { useRouter } from 'next/navigation'
import { KIND_META, sourceLabel } from '@/lib/facility-display'
import type { AdminFacilityListItem } from '@/lib/api'

interface Props {
  items: AdminFacilityListItem[]
}

export function TariffFacilityTable({ items }: Props) {
  const router = useRouter()

  return (
    <div className="table-wrapper">
      <table className="table table--clickable">
        <thead>
          <tr>
            <th>Name</th>
            <th>Operator</th>
            <th>Kind</th>
            <th>Capacity</th>
            <th>Status</th>
            <th>Verified</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const kind = KIND_META[item.kind]
            return (
              <tr key={item.id} onClick={() => router.push(`/dashboard/tariffs/${item.id}`)}>
                <td>
                  <span className="table-link">{item.name}</span>
                  <span className="table__sub">{item.address}</span>
                </td>
                <td className="text-secondary">
                  {item.operatorName}
                  <span className="table__sub">{sourceLabel(item.source)}</span>
                </td>
                <td>
                  <span className={`badge ${kind.badge}`}>{kind.label}</span>
                </td>
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
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
