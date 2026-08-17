import { redirect } from 'next/navigation'
import { navForAdmin } from '@/lib/nav'

export default function AdminIndexPage(): never {
  const [first] = navForAdmin()
  redirect(first?.href ?? '/admin/operators')
}
