import { useState, type FormEvent } from 'react'
import { BrandMark } from '@/components/brand/BrandMark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'
import { branding } from '@/lib/branding'
import { cn } from '@/lib/utils'

const demoAccounts = [
  { label: 'Student', email: 'student@facilitas.edu', password: 'student123' },
  { label: 'Admin', email: 'admin@facilitas.edu', password: 'admin123' },
  {
    label: 'Superadmin',
    email: 'superadmin@facilitas.edu',
    password: 'super123',
  },
] as const

export function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const user = await login(email, password)
      if (!user) {
        setError('Invalid email or password.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function fillDemo(account: (typeof demoAccounts)[number]) {
    setEmail(account.email)
    setPassword(account.password)
    setError(null)
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-brand-blue/5 to-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="pointer-events-none">
            <BrandMark showWordmark={false} size="md" className="justify-center" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-brand-blue">
              Sign in to {branding.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {branding.description}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-10 w-full bg-brand-gold font-semibold text-brand-blue hover:bg-brand-gold/90"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Demo accounts (run seed:seedUsers first)
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => fillDemo(account)}
                className={cn(
                  'rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-brand-blue transition-colors hover:border-brand-gold hover:bg-brand-gold/10',
                )}
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
