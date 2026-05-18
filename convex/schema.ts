import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export const userRole = v.union(
  v.literal('superadmin'),
  v.literal('admin'),
  v.literal('student'),
)

export const facilityStatus = v.union(
  v.literal('available'),
  v.literal('maintenance'),
)

export const reservationStatus = v.union(
  v.literal('pending'),
  v.literal('approved'),
  v.literal('rejected'),
)

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: userRole,
  })
    .index('by_email', ['email'])
    .index('by_role', ['role']),

  facilities: defineTable({
    name: v.string(),
    description: v.string(),
    status: facilityStatus,
  })
    .index('by_status', ['status'])
    .index('by_name', ['name']),

  reservations: defineTable({
    facilityId: v.id('facilities'),
    userId: v.id('users'),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    status: reservationStatus,
  })
    .index('by_facility', ['facilityId'])
    .index('by_user', ['userId'])
    .index('by_status', ['status'])
    .index('by_facility_date', ['facilityId', 'date'])
    .index('by_date', ['date']),
})
