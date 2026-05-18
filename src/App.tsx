import { RouterProvider } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { Login } from '@/pages/Login'
import { ConvexClientProvider } from '@/providers/ConvexClientProvider'
import { router } from '@/routes'

function AuthGate() {
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

  return <RouterProvider router={router} />
}

function App() {
  return (
    <ConvexClientProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ConvexClientProvider>
  )
}

export default App
