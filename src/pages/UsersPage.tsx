import { PageHeader } from '@/components/layout/PageHeader'

export function UsersPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        title="User management"
        description="View users and update roles (superadmin)."
      />
    </section>
  )
}
