import { PageHeader } from '@/components/layout/PageHeader'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

const actionClass =
  'inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors'

export function HomePage() {
  return (
    <section className="space-y-8">
      <PageHeader
        title="Welcome home"
        description="Browse facilities and manage your upcoming reservations."
      />
      <div className="flex flex-wrap gap-3">
        <Link
          to="/facilities"
          className={cn(
            actionClass,
            'bg-brand-gold text-brand-blue shadow-sm hover:bg-brand-gold/90',
          )}
        >
          Browse facilities
        </Link>
        <Link
          to="/my-reservations"
          className={cn(
            actionClass,
            'border border-border bg-card text-foreground hover:bg-muted',
          )}
        >
          My reservations
        </Link>
      </div>
    </section>
  )
}
