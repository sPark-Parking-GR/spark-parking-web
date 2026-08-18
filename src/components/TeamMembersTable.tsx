import { getTranslations } from 'next-intl/server'
import { Badge } from '@spark/ui'
import type { BadgeVariant } from '@spark/ui'
import { ORG_PERMISSIONS } from '@spark/types'
import { TeamChangeRoleButton } from './TeamChangeRoleButton'
import { TeamMemberScopesButton } from './TeamMemberScopesButton'
import { TeamRemoveMemberButton } from './TeamRemoveMemberButton'
import type { TeamMemberSummary } from '@/lib/team-types'

interface Props {
  operatorId: string
  members: TeamMemberSummary[]
  currentUserId: string
}

const ROLE_BADGE: Record<TeamMemberSummary['role'], BadgeVariant> = {
  ADMIN: 'ok',
  STAFF: 'neutral',
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const TOTAL_SCOPES = ORG_PERMISSIONS.length

export async function TeamMembersTable({ operatorId, members, currentUserId }: Props) {
  const t = await getTranslations('team')
  const tRole = await getTranslations('team.roleOptions')
  const adminCount = members.filter((m) => m.role === 'ADMIN').length

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>{t('table.email')}</th>
            <th>{t('table.role')}</th>
            <th>{t('table.scopes')}</th>
            <th>{t('table.joined')}</th>
            <th>{t('table.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const isSelf = member.userId === currentUserId
            const isSoleAdmin = member.role === 'ADMIN' && adminCount === 1

            return (
              <tr key={member.userId}>
                <td className="table-facility">{member.email}</td>
                <td>
                  <Badge variant={ROLE_BADGE[member.role]}>{tRole(member.role)}</Badge>
                </td>
                <td>
                  {member.role === 'ADMIN' ? (
                    <>
                      <div>{t('scopesSummary.fullAccess')}</div>
                      <div className="table__sub">{t('scopesSummary.adminHint')}</div>
                    </>
                  ) : (
                    <span className="text-secondary">
                      {t('scopesSummary.count', {
                        count: member.scopes.length,
                        total: TOTAL_SCOPES,
                      })}
                    </span>
                  )}
                </td>
                <td className="text-secondary">{dateFmt.format(new Date(member.createdAt))}</td>
                <td>
                  {isSelf ? (
                    <span className="text-secondary">{t('selfNote')}</span>
                  ) : isSoleAdmin ? (
                    <span className="text-secondary">{t('soleAdminNote')}</span>
                  ) : (
                    <div className="table-actions">
                      {member.role === 'STAFF' ? (
                        <TeamMemberScopesButton
                          operatorId={operatorId}
                          userId={member.userId}
                          email={member.email}
                          scopes={member.scopes}
                        />
                      ) : null}
                      <TeamChangeRoleButton
                        operatorId={operatorId}
                        userId={member.userId}
                        email={member.email}
                        currentRole={member.role}
                      />
                      <TeamRemoveMemberButton
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
