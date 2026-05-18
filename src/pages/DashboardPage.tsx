import { PageHeader } from '@/components/layout/PageHeader'

export function DashboardPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        title="Admin dashboard"
        description="Pending approvals, weekly stats, and quick actions."
      />
    </section>
  )
}
