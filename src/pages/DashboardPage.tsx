import { Suspense } from 'react'
import {
  Clock,
  CheckCircle,
  Building2,
} from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '../../convex/_generated/api'
import { useQuery } from 'convex/react'

function StatCard(props: {
  label: string
  value: number
  icon: React.ReactNode
  accent?: string
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {props.label}
          </CardTitle>
          <span className={props.accent}>{props.icon}</span>
        </div>
        <p className="mt-2 text-3xl font-bold tracking-tight">
          {props.value}
        </p>
      </CardHeader>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    pending:
      'bg-brand-gold/15 text-brand-gold border-brand-gold/30',
    approved: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
    rejected: 'bg-red-500/15 text-red-600 border-red-500/30',
  }

  return (
    <Badge className={variants[status] ?? ''}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

function DashboardContent() {
  const stats = useQuery(api.dashboard.getDashboardStats)
  const recent = useQuery(api.dashboard.getRecentReservations)

  if (stats === undefined || recent === undefined) return null

  return (
    <div className="space-y-8">
      {/* ── Stat Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Pending Approvals"
          value={stats.pendingCount}
          icon={<Clock className="h-5 w-5 text-brand-gold" />}
          accent="text-brand-gold"
        />
        <StatCard
          label="Total Approved"
          value={stats.approvedCount}
          icon={<CheckCircle className="h-5 w-5 text-brand-blue" />}
        />
        <StatCard
          label="Total Facilities"
          value={stats.facilitiesCount}
          icon={<Building2 className="h-5 w-5 text-brand-blue" />}
        />
      </div>

      {/* ── Recent Reservations Table ───────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          Recent Reservations
        </h3>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Facility Name
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Requested By
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Date &amp; Time
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {recent.map((reservation, idx) => (
                <tr
                  key={reservation._id}
                  className={
                    idx < recent.length - 1 ? 'border-b border-border' : ''
                  }
                >
                  <td className="px-4 py-3 font-medium">
                    {reservation.facilityName}
                  </td>
                  <td className="px-4 py-3">{reservation.userName}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {reservation.date} &middot; {reservation.startTime}
                    &ndash;{reservation.endTime}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={reservation.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="mt-2 h-8 w-16 rounded bg-muted" />
            </CardHeader>
          </Card>
        ))}
      </div>
      <div className="h-64 rounded-xl border border-border bg-card" />
    </div>
  )
}

export function DashboardPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of facility reservations."
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </section>
  )
}
