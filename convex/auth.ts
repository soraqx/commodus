import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { userRole } from './schema'

function toPublicUser(user: Doc<'users'>) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  }
}

export const login = query({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { email, password }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email.trim().toLowerCase()))
      .unique()

    if (!user || user.password !== password) {
      return null
    }

    return toPublicUser(user)
  },
})

export const getUserById = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId)
    if (!user) return null
    return toPublicUser(user)
  },
})

export const register = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: userRole,
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase()

    const existing = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email))
      .unique()

    if (existing) {
      throw new Error('An account with this email already exists.')
    }

    const userId = await ctx.db.insert('users', {
      name: args.name.trim(),
      email,
      password: args.password,
      role: args.role,
    })

    const user = await ctx.db.get(userId)
    if (!user) {
      throw new Error('Failed to create user.')
    }

    return toPublicUser(user)
  },
})
