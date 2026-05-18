import { createBrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { AuthLayout } from '@/components/layout/AuthLayout'
import {
  RequireAdmin,
  RequireStudent,
  RequireSuperadmin,
  RoleHomeRedirect,
} from '@/components/auth/RouteGuards'
import { RoleBasedLayout } from '@/components/layout/RoleBasedLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { FacilitiesPage } from '@/pages/FacilitiesPage'
import { HomePage } from '@/pages/HomePage'
import { MyReservationsPage } from '@/pages/MyReservationsPage'
import { PendingApprovalsPage } from '@/pages/PendingApprovalsPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { UsersPage } from '@/pages/UsersPage'

export const router = createBrowserRouter([
  {
    element: (
      <AuthProvider>
        <AuthLayout />
      </AuthProvider>
    ),
    children: [
      {
        path: '/',
        element: <RoleBasedLayout />,
        children: [
          { index: true, element: <RoleHomeRedirect /> },

          {
            path: 'home',
            element: (
              <RequireStudent>
                <HomePage />
              </RequireStudent>
            ),
          },
          {
            path: 'my-reservations',
            element: (
              <RequireStudent>
                <MyReservationsPage />
              </RequireStudent>
            ),
          },

          {
            path: 'dashboard',
            element: (
              <RequireAdmin>
                <DashboardPage />
              </RequireAdmin>
            ),
          },
          {
            path: 'approvals',
            element: (
              <RequireAdmin>
                <PendingApprovalsPage />
              </RequireAdmin>
            ),
          },
          {
            path: 'reports',
            element: (
              <RequireAdmin>
                <ReportsPage />
              </RequireAdmin>
            ),
          },
          {
            path: 'settings',
            element: (
              <RequireAdmin>
                <SettingsPage />
              </RequireAdmin>
            ),
          },
          {
            path: 'users',
            element: (
              <RequireSuperadmin>
                <UsersPage />
              </RequireSuperadmin>
            ),
          },

          { path: 'facilities', element: <FacilitiesPage /> },
        ],
      },
    ],
  },
])
