import { ChevronDown, LogOut, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type UserMenuProps = {
  name: string
  email?: string
  variant?: 'light' | 'dark'
  onSignOut?: () => void
}

export function UserMenu({
  name,
  email,
  variant = 'light',
  onSignOut,
}: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  function handleSignOut() {
    setOpen(false)
    onSignOut?.()
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'flex items-center gap-2 rounded-lg border px-2 py-1.5 text-sm font-medium transition-colors',
          variant === 'dark'
            ? 'border-white/20 text-white hover:bg-white/10'
            : 'border-border bg-card text-foreground hover:bg-muted',
        )}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span
          className={cn(
            'flex size-8 items-center justify-center rounded-full text-xs font-semibold',
            variant === 'dark'
              ? 'bg-brand-gold text-brand-blue'
              : 'bg-brand-blue text-white',
          )}
        >
          {initials}
        </span>
        <span className="hidden max-w-[8rem] truncate sm:inline">{name}</span>
        <ChevronDown className="size-4 opacity-70" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg"
        >
          {email ? (
            <div className="border-b border-border px-3 py-2">
              <p className="text-sm font-medium">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            <User className="size-4" />
            Profile
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
            onClick={handleSignOut}
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  )
}
