import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Login } from '@/pages/Login'

/**
 * AuthLayout handles authentication state and conditionally renders either:
 * - Loading state while auth initializes
 * - Login page if user is not authenticated
 * - Routes if user is authenticated
 */
export function AuthLayout() {
    const { currentUser, isInitializing } = useAuth()

    if (isInitializing) {
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

    if (!currentUser) {
        return <Login />
    }

    return <Outlet />
}
