import type { Id } from '../../convex/_generated/dataModel'

export type UserRole = 'superadmin' | 'admin' | 'student'

export type FacilityStatus = 'available' | 'maintenance'

export type ReservationStatus = 'pending' | 'approved' | 'rejected'

export type ReportRange = '7days' | 'week' | 'month'

export type AuthUser = {
  _id: Id<'users'>
  name: string
  email: string
  role: UserRole
}
