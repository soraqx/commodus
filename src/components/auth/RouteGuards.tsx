import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useCurrentUser } from '@/hooks/useCurrentUser'

function GuardLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-4 border-brand-blue border-t-transparent" />
    </div>
  )
}

export function RequireStudent({ children }: { children: ReactNode }) {
  const { isLoading, isStudent } = useCurrentUser()
  if (isLoading) return <GuardLoading />
  if (!isStudent) return <Navigate to="/dashboard" replace />
  return children
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isLoading, isAdmin } = useCurrentUser()
  if (isLoading) return <GuardLoading />
  if (!isAdmin) return <Navigate to="/home" replace />
  return children
}

export function RequireSuperadmin({ children }: { children: ReactNode }) {
  const { isLoading, isSuperadmin } = useCurrentUser()
  if (isLoading) return <GuardLoading />
  if (!isSuperadmin) return <Navigate to="/dashboard" replace />
  return children
}

export function RoleHomeRedirect() {
  const { isLoading, isStudent } = useCurrentUser()
  if (isLoading) return <GuardLoading />
  return <Navigate to={isStudent ? '/home' : '/dashboard'} replace />
}
