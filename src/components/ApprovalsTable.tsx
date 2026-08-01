import { getTranslations } from 'next-intl/server'
import { ApproveRequestButton } from './ApproveRequestButton'
import { RejectRequestButton } from './RejectRequestButton'
import type { LifecycleApprovalRequest } from '@/lib/lifecycle-api'

interface Props {
  items: LifecycleApprovalRequest[]
  currentUserId: string
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export async function ApprovalsTable({ items, currentUserId }: Props) {
  const t = await getTranslations('adminLifecycle')

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>{t('approvals.table.resource')}</th>
            <th>{t('approvals.table.reason')}</th>
            <th>{t('approvals.table.requestedBy')}</th>
            <th>{t('approvals.table.requestedAt')}</th>
            <th>{t('approvals.table.expiresAt')}</th>
            <th>{t('approvals.table.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isSelf = item.requestedBy === currentUserId
            const resourceLabel = `${t(`resourceType.${item.resourceType}`)} · ${item.resourceId.slice(0, 10)}`
            return (
              <tr key={item.id}>
                <td className="table-facility mono table-code">{resourceLabel}</td>
                <td className="text-secondary">{item.reason}</td>
                <td className="text-secondary mono table-code">{item.requestedBy.slice(0, 10)}</td>
                <td className="text-secondary">{dateFmt.format(new Date(item.createdAt))}</td>
                <td className="text-secondary">{dateFmt.format(new Date(item.expiresAt))}</td>
                <td>
                  <div className="table-actions">
                    {isSelf ? (
                      <span className="text-secondary">{t('approvals.selfRequestNote')}</span>
                    ) : (
                      <ApproveRequestButton id={item.id} resourceLabel={resourceLabel} />
                    )}
                    <RejectRequestButton id={item.id} resourceLabel={resourceLabel} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
