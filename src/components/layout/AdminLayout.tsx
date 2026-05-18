import {
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  LayoutDashboard,
  Settings,
  Users,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { BrandMark } from '@/components/brand/BrandMark'
import { UserMenu } from '@/components/layout/UserMenu'
import { useAuth } from '@/context/AuthContext'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { cn } from '@/lib/utils'

const sidebarLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/facilities', label: 'Facilities Management', icon: Building2 },
  { to: '/approvals', label: 'Pending Approvals', icon: ClipboardList },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  {
    to: '/users',
    label: 'User Management',
    icon: Users,
    superadminOnly: true,
  },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const

export function AdminLayout() {
  const { user, isSuperadmin } = useCurrentUser()
  const { logout } = useAuth()

  const links = sidebarLinks.filter(
    (link) => !('superadminOnly' in link && link.superadminOnly) || isSuperadmin,
  )

  return (
    <div className="flex min-h-svh bg-background">
      <aside className="hidden w-64 shrink-0 flex-col bg-brand-blue text-white lg:flex">
        <div className="border-b border-white/10 px-4 py-5">
          <BrandMark to="/dashboard" variant="dark" size="sm" />
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Admin sidebar">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-gold text-brand-blue shadow-sm'
                    : 'text-white/85 hover:bg-white/10 hover:text-white',
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-border bg-card px-4 shadow-sm sm:px-6">
          <div className="flex items-center gap-3 lg:hidden">
            <BrandMark to="/dashboard" size="sm" />
          </div>
          <p className="hidden text-sm font-medium text-muted-foreground lg:block">
            Admin workspace
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="relative rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-5" />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-brand-gold" />
            </button>
            <UserMenu
              name={user?.name ?? 'Admin'}
              email={user?.email}
              onSignOut={logout}
            />
          </div>
        </header>

        <nav
          className="flex gap-1 overflow-x-auto border-b border-border bg-brand-blue px-3 py-2 lg:hidden"
          aria-label="Admin navigation mobile"
        >
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium',
                  isActive
                    ? 'bg-brand-gold text-brand-blue'
                    : 'text-white/85',
                )
              }
            >
              <Icon className="size-3.5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
