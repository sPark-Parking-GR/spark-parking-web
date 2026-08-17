import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { navForAdmin } from '@/lib/nav'

// Lands on the first item the VIEWER can actually see. Resolving the nav against a fixed
// role would redirect an administrator to a page their permissions deny them.
export default async function AdminIndexPage(): Promise<never> {
  const session = await getSession('admin')
  const [first] = session.user ? navForAdmin(session.user.role) : []
  redirect(first?.href ?? '/admin/operators')
}
