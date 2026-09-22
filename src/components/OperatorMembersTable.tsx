import { getTranslations } from 'next-intl/server'
import { ChangeMemberRoleButton } from './ChangeMemberRoleButton'
import { RemoveMemberButton } from './RemoveMemberButton'
import type { OperatorMemberSummary, OperatorStatus } from '@/lib/operator-actions'
import type { OperatorMemberRole } from '@/lib/operator-member-actions'

interface Props {
  operatorId: string
  operatorStatus: OperatorStatus
  members: OperatorMemberSummary[]
  canGrantRoles: boolean
  currentUserId: string
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export async function OperatorMembersTable({
  operatorId,
  operatorStatus,
  members,
  canGrantRoles,
  currentUserId,
}: Props) {
  const t = await getTranslations('onboarding.detail.members')
  const tRole = await getTranslations('onboarding.detail.members.roleOptions')
  const adminCount = members.filter((m) => m.role === 'ADMIN').length

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>{t('email')}</th>
            <th>{t('role')}</th>
            <th>{t('joined')}</th>
            <th>{t('actions')}</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const isSelf = member.userId === currentUserId
            const isSoleAdmin =
              operatorStatus === 'VERIFIED' && member.role === 'ADMIN' && adminCount === 1

            return (
              <tr key={member.userId}>
                <td>{member.email}</td>
                <td className="text-secondary">{tRole(member.role)}</td>
                <td className="text-secondary">{dateFmt.format(new Date(member.createdAt))}</td>
                <td>
                  {!canGrantRoles ? (
                    <span className="text-secondary">—</span>
                  ) : isSelf ? (
                    <span className="text-secondary">{t('selfNote')}</span>
                  ) : isSoleAdmin ? (
                    <span className="text-secondary">{t('soleAdminNote')}</span>
                  ) : (
                    <div className="table-actions">
                      <ChangeMemberRoleButton
                        operatorId={operatorId}
                        userId={member.userId}
                        email={member.email}
                        currentRole={member.role as OperatorMemberRole}
                      />
                      <RemoveMemberButton
                        operatorId={operatorId}
                        userId={member.userId}
                        email={member.email}
                      />
                    </div>
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
