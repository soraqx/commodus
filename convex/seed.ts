import { mutation } from './_generated/server'

const demoUsers = [
  {
    name: 'Alex Student',
    email: 'student@facilitas.edu',
    password: 'student123',
    role: 'student' as const,
  },
  {
    name: 'Jordan Admin',
    email: 'admin@facilitas.edu',
    password: 'admin123',
    role: 'admin' as const,
  },
  {
    name: 'Sam Superadmin',
    email: 'superadmin@facilitas.edu',
    password: 'super123',
    role: 'superadmin' as const,
  },
]

/** Run once from the Convex dashboard to populate demo users. */
export const seedUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const ids = []
    for (const user of demoUsers) {
      const existing = await ctx.db
        .query('users')
        .withIndex('by_email', (q) => q.eq('email', user.email))
        .unique()
      if (existing) {
        await ctx.db.patch(existing._id, {
          name: user.name,
          password: user.password,
          role: user.role,
        })
        ids.push(existing._id)
        continue
      }
      ids.push(await ctx.db.insert('users', user))
    }
    return ids
  },
})
