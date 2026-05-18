import { PageHeader } from '@/components/layout/PageHeader'

export function PendingApprovalsPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        title="Pending approvals"
        description="Review and approve or reject reservation requests."
      />
    </section>
  )
}
