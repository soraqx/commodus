import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { facilityStatus } from './schema'

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('facilities').order('desc').collect()
  },
})

export const listAvailable = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('facilities')
      .withIndex('by_status', (q) => q.eq('status', 'available'))
      .collect()
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    status: facilityStatus,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('facilities')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .unique()

    if (existing) {
      throw new Error(`A facility named "${args.name}" already exists.`)
    }

    return await ctx.db.insert('facilities', args)
  },
})
