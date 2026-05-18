import { PageHeader } from '@/components/layout/PageHeader'

export function MyReservationsPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        title="My reservations"
        description="View pending, approved, and past facility bookings."
      />
    </section>
  )
}
