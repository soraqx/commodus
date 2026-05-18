import { AdminLayout } from '@/components/layout/AdminLayout'
import { StudentLayout } from '@/components/layout/StudentLayout'
import { useCurrentUser } from '@/hooks/useCurrentUser'

function LayoutLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div
          className="size-10 animate-spin rounded-full border-4 border-brand-blue border-t-transparent"
          aria-hidden
        />
        <p className="text-sm text-muted-foreground">Loading Facilitas…</p>
      </div>
    </div>
  )
}

/** Picks StudentLayout or AdminLayout from Convex user role. */
export function RoleBasedLayout() {
  const { isLoading, isStudent } = useCurrentUser()

  if (isLoading) {
    return <LayoutLoading />
  }

  return isStudent ? <StudentLayout /> : <AdminLayout />
}
