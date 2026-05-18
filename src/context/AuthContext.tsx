import { useConvex, useMutation, useQuery } from 'convex/react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import type { AuthUser, UserRole } from '@/types'

const STORAGE_KEY = 'facilitas_user_id'

type RegisterInput = {
  name: string
  email: string
  password: string
  role: UserRole
}

type AuthContextValue = {
  currentUser: AuthUser | null | undefined
  isInitializing: boolean
  login: (email: string, password: string) => Promise<AuthUser | null>
  register: (input: RegisterInput) => Promise<AuthUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredUserId(): Id<'users'> | null {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? (stored as Id<'users'>) : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const convex = useConvex()
  const registerMutation = useMutation(api.auth.register)

  const [userId, setUserId] = useState<Id<'users'> | null>(() => readStoredUserId())

  const currentUser = useQuery(
    api.auth.getUserById,
    userId ? { userId } : 'skip',
  )

  const isInitializing = userId !== null && currentUser === undefined

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUserId(null)
  }, [])

  useEffect(() => {
    if (userId && currentUser === null) {
      logout()
    }
  }, [userId, currentUser, logout])

  const login = useCallback(
    async (email: string, password: string) => {
      const user = await convex.query(api.auth.login, {
        email: email.trim().toLowerCase(),
        password,
      })

      if (!user) return null

      localStorage.setItem(STORAGE_KEY, user._id)
      setUserId(user._id)
      return user
    },
    [convex],
  )

  const register = useCallback(
    async (input: RegisterInput) => {
      const user = await registerMutation({
        name: input.name,
        email: input.email.trim().toLowerCase(),
        password: input.password,
        role: input.role,
      })

      localStorage.setItem(STORAGE_KEY, user._id)
      setUserId(user._id)
      return user
    },
    [registerMutation],
  )

  const value = useMemo(
    () => ({
      currentUser: userId ? currentUser : null,
      isInitializing,
      login,
      register,
      logout,
    }),
    [currentUser, userId, isInitializing, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
