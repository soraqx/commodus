import { useAuth } from '@/context/AuthContext'
import type { UserRole } from '@/types'

export function useCurrentUser() {
  const { currentUser, isInitializing } = useAuth()

  return {
    user: currentUser ?? undefined,
    isLoading: isInitializing,
    role: currentUser?.role as UserRole | undefined,
    isStudent: currentUser?.role === 'student',
    isAdmin:
      currentUser?.role === 'admin' || currentUser?.role === 'superadmin',
    isSuperadmin: currentUser?.role === 'superadmin',
  }
}
