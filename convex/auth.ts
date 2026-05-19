import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { userRole } from './schema'

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

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split('$')
  if (parts.length !== 4 || parts[0] !== 'pbkdf2_sha256') {
    return false
  }
  const iterations = parseInt(parts[1], 10)
  const salt = new Uint8Array(parts[2].match(/.{1,2}/g)!.map(h => parseInt(h, 16)))
  const expectedHash = parts[3]

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
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    KEY_LENGTH * 8
  )
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex === expectedHash
}

function toPublicUser(user: {
  _id: string
  name: string
  email: string
  role: 'superadmin' | 'admin' | 'student'
}) {
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

    if (!user) {
      return null
    }

    const isValid = await verifyPassword(password, user.passwordHash)

    if (!isValid) {
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

    const passwordHash = await hashPassword(args.password)

    const userId = await ctx.db.insert('users', {
      name: args.name.trim(),
      email,
      passwordHash,
      role: args.role,
    })

    const user = await ctx.db.get(userId)
    if (!user) {
      throw new Error('Failed to create user.')
    }

    return toPublicUser(user)
  },
})

/**
 * Migration helper: Converts a plaintext password to a hashed one.
 * Call this on login if the stored password doesn't match the hash format.
 */
export const migratePasswordIfNeeded = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { email, password }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email.trim().toLowerCase()))
      .unique()

    if (!user) {
      return null
    }

    // Check if already hashed (hash format: pbkdf2_sha256$iterations$salt$hash)
    if (user.passwordHash.includes('$')) {
      return null // Already migrated
    }

    // Plaintext password - verify and migrate
    if (user.passwordHash === password) {
      const passwordHash = await hashPassword(password)
      await ctx.db.patch(user._id, { passwordHash })
      return toPublicUser(user)
    }

    return null
  },
})