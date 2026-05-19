import { mutation } from './_generated/server'

const SALT_LENGTH = 16
const ITERATIONS = 100000
const KEY_LENGTH = 32

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const encoder = new TextEncoder()
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    KEY_LENGTH * 8
  )
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
  return `pbkdf2_sha256$${ITERATIONS}$${saltHex}$${hashHex}`
}

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

      const passwordHash = await hashPassword(user.password)

      if (existing) {
        await ctx.db.patch(existing._id, {
          name: user.name,
          passwordHash,
          role: user.role,
        })
        ids.push(existing._id)
        continue
      }
      ids.push(
        await ctx.db.insert('users', {
          name: user.name,
          email: user.email,
          passwordHash,
          role: user.role,
        })
      )
    }
    return ids
  },
})