import { query } from './_generated/server'
import type { Doc } from './_generated/dataModel'

// ── Public queries ────────────────────────────────────────────────────────────

/**
 * Aggregate counts for the dashboard stat cards:
 *  - pendingCount  : reservations with status "pending"
 *  - approvedCount : reservations with status "approved"
 *  - facilitiesCount : total number of records in the facilities table
 */
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const [pending, approved] = await Promise.all([
      ctx.db
        .query('reservations')
        .withIndex('by_status', (q) => q.eq('status', 'pending'))
        .collect(),
      ctx.db
        .query('reservations')
        .withIndex('by_status', (q) => q.eq('status', 'approved'))
        .collect(),
    ])

    const facilities = await ctx.db.query('facilities').collect()

    return {
      pendingCount: pending.length,
      approvedCount: approved.length,
      facilitiesCount: facilities.length,
    }
  },
})

/**
 * The 5 most recently-created reservations, enriched with the associated
 * user name and facility name for display.
 */
export const getRecentReservations = query({
  args: {},
  handler: async (ctx) => {
    // Take only the 5 most recently created reservations.
    const reservations = await ctx.db
      .query('reservations')
      .order('desc')
      .take(5)

    // Batch-fetch user and facility documents in parallel.
    const enriched = await Promise.all(
      reservations.map(async (reservation) => {
        const user: Doc<'users'> | null = await ctx.db.get(reservation.userId)
        const facility: Doc<'facilities'> | null = await ctx.db.get(
          reservation.facilityId,
        )

        return {
          _id: reservation._id,
          _creationTime: reservation._creationTime,
          facilityName: facility?.name ?? 'Unknown Facility',
          userName: user?.name ?? 'Unknown User',
          date: reservation.date,
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          status: reservation.status,
        }
      }),
    )

    return enriched
  },
})
